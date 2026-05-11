export const ROLES = ["system_admin", "project_admin", "field_engineer", "vendor"];
export const EntryStatus = ["DRAFT","SUBMITTED", "APPROVED", "REJECTED", "RETURNED"];
export const ReportType = ["PROGRESS", "COMPLIANCE", "FINANCIAL"];
export const WorkCategory = ["CABLE_LAYING", "LOCATION_BOX", "SIGNAL_ITEMS", "POINT_MACHINE", "TRACK_CIRCUIT", "SIGHTING_BOARD", "INDOOR_WORK", "POWER_SUPPLY", "TELECOM_WORKS"];
export const SCOPES_MAP = {
    "system_admin": ["user:read", "user:write"],
    "project_admin": ["user:read", "user:write", "project:read", "project:write", "activity:read", "activity:write", "span:read", "span:write"],
    "field_engineer": ["activity:read", "activity:write", "project:read", "span:read","user:read", "user:write", "project:read"],
    "vendor": ["span:read", "span:write", "activity:read", "activity:write", "user:read", "user:write", "project:read"],
}
export const ProjectStatusEnum = ["ACTIVE", "INACTIVE", "ON_HOLD", "CANCELLED", "COMPLETED"];
export const ColorCodesEnum = [
    '#3B82F6', '#22C55E', '#EAB308', '#D946EF',
    '#F97316', '#14B8A6', '#6366F1', '#EF4444', '#A855F7', '#EC4899',
];
export const MeasurementTypeEnum = ["number", "text", "select", "multiselect", "boolean", "table", "time", "phone"];