const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (srv) {
  const RCMJobApplicationService = await cds.connect.to('RCMJobApplication');
  const RCMCandidateService = await cds.connect.to('RCMCandidate');

  srv.on('READ', 'JobApplication', req => RCMJobApplicationService.run(req.query));
  srv.on('READ', 'JobApplicationStatus', req => RCMJobApplicationService.run(req.query));
  srv.on('READ', 'JobApplicationStatusLabel', req => RCMJobApplicationService.run(req.query));
  srv.on('READ', 'Candidate', req => RCMCandidateService.run(req.query));

  srv.on('READ', 'JobApplicationStatusesWithLabels', async req => {
    const tx = RCMJobApplicationService.transaction(req);
    const statuses = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatus'));
    const allLabels = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatusLabel'));
    const labelMap = new Map();
    for (const label of allLabels) {
      if (!labelMap.has(label.appStatusId) && label.statusLabel) {
        labelMap.set(label.appStatusId, label.statusLabel);
      }
    }
    const statusMap = new Map();
    for (const status of statuses) {
      if (!statusMap.has(status.appStatusId)) {
        statusMap.set(status.appStatusId, {
          ID: uuidv4(),
          appStatusId: status.appStatusId,
          appStatusName: status.appStatusName,
          statusLabel: labelMap.get(status.appStatusId) || '[No Label]'
        });
      }
    }
    return Array.from(statusMap.values());
  });

  srv.on('READ', 'CandidatesByStatus', async req => {
    const { appStatusId } = req.data;
    if (!appStatusId) return [];

    const txJobApp = RCMJobApplicationService.transaction(req);
    const txCandidate = RCMCandidateService.transaction(req);

    const applications = await txJobApp.run(
      SELECT.from('RCMJobApplication.JobApplication').where({ appStatusSetItemId: appStatusId })
    );

    if (!applications.length) return [];

    const candidateIds = [...new Set(applications.map(app => app.candidateId).filter(Boolean))];

    const candidates = await txCandidate.run(
      SELECT.from('RCMCandidate.Candidate').where('candidateId in', candidateIds)
    );

    return applications.map(app => {
      const candidate = candidates.find(c => c.candidateId === app.candidateId);
      return {
        applicationId: app.applicationId,
        candidateId: app.candidateId,
        appStatusId: app.appStatusSetItemId,
        firstName: candidate?.firstName || '',
        lastName: candidate?.lastName || '',
        email: candidate?.contactEmail || ''
      };
    });
  });
  srv.on('READ', 'TestAppStatusLink', async (req) => {
    const tx = cds.transaction(req);
    const jobApps = await tx.run(SELECT.from('RCMJobApplication.JobApplication'));
    const statuses = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatus'));
  
    const statusMap = new Map();
    for (const status of statuses) {
      statusMap.set(status.appStatusId, status);
    }
  
    const matches = [];
  
    for (const app of jobApps) {
      const status = statusMap.get(app.appStatusSetItemId);
      if (status) {
        matches.push({
          applicationId: app.applicationId,
          appStatusSetItemId: app.appStatusSetItemId,
          matchedStatusName: status.appStatusName
        });
      }
    }
  
    return matches.slice(0, 50); // Limit results
  });
  
};
