using { RCMJobApplication } from '../srv/external/RCMJobApplication';
using { RCMCandidate } from '../srv/external/RCMCandidate';

service CatalogService {

  entity JobApplicationStatus as projection on RCMJobApplication.JobApplicationStatus;
  entity JobApplicationStatusLabel as projection on RCMJobApplication.JobApplicationStatusLabel;

  entity Candidate as projection on RCMCandidate.Candidate 
    excluding { address2, homePhone, middleName, password };

  entity JobApplicationStatusesWithLabels {
    key ID             : UUID;
        appStatusId    : String;
        appStatusName  : String;
        statusLabel    : String;
  }

  entity CandidatesByStatus {
    key applicationId : String;
        usersSysId     : String;
        appStatusId    : String;
        firstName      : String;
        lastName       : String;
        email          : String;
  }
}
