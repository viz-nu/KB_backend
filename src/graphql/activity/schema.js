export const activityTypeDefs = `#graphql
enum WorkCategoryEnum {
    CABLE_LAYING
    LOCATION_BOX
    SIGNAL_ITEMS
    POINT_MACHINE
    TRACK_CIRCUIT
    SIGHTING_BOARD
    INDOOR_WORK
    POWER_SUPPLY
    TELECOM_WORKS
}
enum EntryStatusEnum {
    DRAFT
    PENDING
    APPROVED
    REJECTED
    RETURNED
}
type Photo {
    url: String
    caption: String
    pointLocation: PointLocation
    capturedAt: DateTime
}
type SemChecklist {
    parameterId: String
    label: String
    value: String
    passed: Boolean
    remark: String
    }
type AuditLog {
    action: String
    description: String
    createdBy: User
    createdAt: DateTime
    updatedAt: DateTime
}
type Activity {
    _id: ID
    project: Project
    title: String
    WorkCategory: WorkCategoryEnum
    status: EntryStatusEnum
    locationDescription: String
    remarks: String
    adminRemark: String
    returnReason: String
    createdBy: User
    updatedBy: User
    createdAt: DateTime
    updatedAt: DateTime
    auditLogs: [AuditLog]
    photos: [Photo]
    semChecklist: [SemChecklist]
    measurements: JSON
    pointLocation: PointLocation
    area: PolygonLocation
    route: LineStringLocation
}
input PhotoInput {
    url: String!
    caption: String!
    pointLocation: PointLocationInput!
    capturedAt: DateTime!
}
input SemChecklistInput {
    parameterId: String!
    label: String!
    value: String!
    passed: Boolean!
    remark: String!
}
input ActivityInput {
    project: ID!
    title: String!
    WorkCategory: WorkCategoryEnum!
    status: EntryStatusEnum!
    locationDescription: String
    pointLocation: PointLocationInput
    area: PolygonLocationInput
    route: LineStringLocationInput
    remarks: String
    adminRemark: String
    returnReason: String
    description: String
    photos: [PhotoInput]
    semChecklist: [SemChecklistInput]
    measurements: JSON
}
type ActivityPagination {
    data: [Activity]
        PaginationMetaData: PaginationMetaData
}
 type Query{
  activities(page: Int = 1, limit: Int = 10): ActivityPagination @requireAnyScope(scopes: ["activity:read","activity:write"])
  activity(_id: ID!): Activity @requireAnyScope(scopes: ["activity:read","activity:write"])
 }

 type Mutation{
  createActivity(activityInput: ActivityInput!): Activity @requireScope(scope: "activity:write")
  updateActivity(_id: ID!, activityInput: ActivityInput!): Activity @requireScope(scope: "activity:write")
  deleteActivity(_id: ID!): Boolean @requireScope(scope: "activity:write")
 }
`;