export const activityTypeDefs = `#graphql

enum EntryStatusEnum {
    DRAFT
    SUBMITTED
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
    span: Span
    WorkCategory: String
    status: EntryStatusEnum
    locationDescription: String
    remarks: String
    adminRemark: String
    returnReason: String
    createdBy: User
    updatedBy: User
    createdAt: DateTime
    updatedAt: DateTime
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
    spanId: ID
    lineItems:JSON
    WorkCategory: String
    locationDescription: String
    remarks: String
    adminRemark: String
    returnReason: String
    status: String
}
type ActivityPagination {
    data: [Activity]
    PaginationMetaData: PaginationMetaData
}
 type Query{
  activities(page: Int = 1, limit: Int = 10 status:String): ActivityPagination @requireAnyScope(scopes: ["activity:read","activity:write"])
  activity(_id: ID!): Activity @requireAnyScope(scopes: ["activity:read","activity:write"])
 }

 type Mutation{
  createActivity(activityInput: ActivityInput!): Activity @requireScope(scope: "activity:write")
  updateActivity(_id: ID!, activityInput: ActivityInput!): Activity @requireScope(scope: "activity:write")
  deleteActivity(_id: ID!): Boolean @requireScope(scope: "activity:write")
 }
`;