using { RCMJobApplication } from '../srv/external/RCMJobApplication';

service CatalogService {
  entity JobApplication as projection on RCMJobApplication.JobApplication;
  entity JobApplicationStatus as projection on RCMJobApplication.JobApplicationStatus;
  entity JobApplicationStatusLabel as projection on RCMJobApplication.JobApplicationStatusLabel;


   // 🔥 Custom virtual entity with label info
  entity JobApplicationStatusesWithLabels {
    key appStatusId   : String;
        appStatusName : String;
        statusLabel   : String;

  // Fix here: use appStatusSetItemId instead of appStatusId
  to_Applications : Association to many JobApplication 
    on to_Applications.appStatusSetItemId = appStatusId;
      }



}
