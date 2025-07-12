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

     // Custom merge logic: status + first available label (any locale)
  srv.on('READ', 'JobApplicationStatusesWithLabels', async req => {
    const tx = RCMJobApplicationService.transaction(req);

    // 1. Get statuses
    const statuses = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatus'));

    // 2. Get all labels
    const allLabels = await tx.run(SELECT.from('RCMJobApplication.JobApplicationStatusLabel'));

    // 3. Group labels by appStatusId and pick first non-null label
    const labelMap = new Map();

    for (const label of allLabels) {
      const { appStatusId, statusLabel } = label;
      if (!labelMap.has(appStatusId) && statusLabel) {
        labelMap.set(appStatusId, statusLabel);
      }
    }

    // 4. Merge status with label (or fallback if missing)
    const result = statuses.map(status => ({
      appStatusId: status.appStatusId,
      appStatusName: status.appStatusName,
      statusLabel: labelMap.get(status.appStatusId) || '[No Label]'
    }));

    return result;
  });
};
