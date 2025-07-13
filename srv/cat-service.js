const cds = require('@sap/cds');
  const { v4: uuidv4 } = require('uuid'); // ← Add this at the top

module.exports = async function (srv) {
  const RCMJobApplicationService = await cds.connect.to('RCMJobApplication');

  srv.on('READ', 'JobApplication', req => RCMJobApplicationService.run(req.query));
  srv.on('READ', 'JobApplicationStatus', req => RCMJobApplicationService.run(req.query));
  srv.on('READ', 'JobApplicationStatusLabel', req => RCMJobApplicationService.run(req.query));


   // ✅ Combined status with label
   srv.on('READ', 'JobApplicationStatusesWithLabels', async (req) => {
    const tx = RCMJobApplicationService.transaction(req);

    const statuses = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatus'));
    const allLabels = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatusLabel'));

    const labelMap = new Map();

    for (const label of allLabels) {
      if (!labelMap.has(label.appStatusId) && label.statusLabel?.trim()) {
        labelMap.set(label.appStatusId, label.statusLabel);
      }
    }

    const result = [];

    for (const status of statuses) {
      const label = labelMap.get(status.appStatusId) || '[No Label]';
      result.push({
        appStatusId: status.appStatusId,
        appStatusName: status.appStatusName,
        statusLabel: label
      });
    }

    return result;
  });
};
