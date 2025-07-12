using { RCMJobApplication } from '../srv/external/RCMJobApplication';

service CatalogService {
  entity JobApplication as projection on RCMJobApplication.JobApplication;
  entity JobApplicationStatus as projection on RCMJobApplication.JobApplicationStatus;
  entity JobApplicationStatusLabel as projection on RCMJobApplication.JobApplicationStatusLabel;

  entity JobApplicationStatusesWithLabels {
    key appStatusId   : String;
        appStatusName : String;
        statusLabel   : String;
  }
}
