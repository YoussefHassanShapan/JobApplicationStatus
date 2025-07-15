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
  
    // Get job applications with the given status
    const applications = await txJobApp.run(
      SELECT.from('RCMJobApplication.JobApplication').where({ appStatusSetItemId: appStatusId })
    );
  
    if (!applications.length) return [];
  
    // Get unique usersSysIds from applications
    const usersSysIds = [...new Set(applications.map(app => app.usersSysId).filter(Boolean))];
  
    // Get corresponding candidates by usersSysId
    const candidates = await txCandidate.run(
      SELECT.from('RCMCandidate.Candidate').where('usersSysId in', usersSysIds)
    );
  
    // Match applications to candidates by usersSysId
    return applications.map(app => {
      const candidate = candidates.find(c => c.usersSysId === app.usersSysId);
      return {
        applicationId: app.applicationId,
        usersSysId: app.usersSysId,
        appStatusId: app.appStatusSetItemId,
        firstName: candidate?.firstName || '',
        lastName: candidate?.lastName || '',
        email: candidate?.contactEmail || ''
      };
    });
  });
  

};
