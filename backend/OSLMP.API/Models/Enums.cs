namespace OSLMP.API.Models;

public enum MeetingType
{
    Meeting,
    LodgeOfInstruction,
    Social,
    Other,
}

public enum PersonType
{
    Member,
    Guest,
}

public enum PersonStatus
{
    Active,
    Inactive,
}

public enum AttendeeStatus
{
    Invited,
    Attending,
    Apologies,
}

public enum DocumentType
{
    Summons,
    Agenda,
    Minutes,
    Notice,
    Correspondence,
    Other,
}
