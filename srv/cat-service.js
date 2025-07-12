const cds = require('@sap/cds');

module.exports = async function (srv) {
  const RCMJobApplicationService = await cds.connect.to('RCMJobApplication');

  srv.on('READ', 'JobApplication', async (req) => {
    return RCMJobApplicationService.run(req.query);
  });

  srv.on('READ', 'JobApplicationStatus', async (req) => {
    return RCMJobApplicationService.run(req.query);
  });

    srv.on('READ', 'JobApplicationStatusLabel', req => {
      return RCMJobApplicationService.run(req.query);
    });

   // Custom handler for merged status + label
  srv.on('READ', 'JobApplicationStatusesWithLabels', async req => {
    const tx = RCMJobApplicationService.transaction(req);

    const statuses = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatus'));
    const allLabels = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatusLabel'));

    // Map appStatusId → first available non-null label
    const labelMap = new Map();
    for (const label of allLabels) {
      if (!labelMap.has(label.appStatusId) && label.statusLabel) {
        labelMap.set(label.appStatusId, label.statusLabel);
      }
    }

    // Combine and return
    return statuses.map(status => ({
      appStatusId: status.appStatusId,
      appStatusName: status.appStatusName,
      statusLabel: labelMap.get(status.appStatusId) || '[No Label]'
    }));
  });
};
