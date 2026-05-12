export const projectTypeDefs = `#graphql
type Vault {
    allotedBudjet: Int
    spentBudjet: Int
    logs: JSON
 }
type Project {
    _id: ID
    name: String
    description: String
    code: String
     Vault: Vault
    status: ProjectStatusEnum
    chapters:[Chapter]
    cumulativeProgress: JSON
    createdBy: User
    updatedBy: User
    createdAt: DateTime
    updatedAt: DateTime
}
enum ProjectStatusEnum {
    ACTIVE
    INACTIVE
    ON_HOLD
    CANCELLED
    COMPLETED
}
input VaultInput {
        allotedBudjet: Int
        spentBudjet: Int
        logs: JSON
 }
 input ChapterInput {
    name: String
    code: String
    color: String
    items: [ItemInput]
 }
 input ItemInput {
    label: String
    code: String
    description: String
    measurements: JSON
 }

 input ProjectInput {
    name: String
    code: String
    description: String
    Vault: VaultInput
    status: ProjectStatusEnum
    chapters:[ChapterInput]
 }
 type ProjectPagination {
    data: [Project]
   PaginationMetaData: PaginationMetaData
 }
 type Query{
  projects(page: Int = 1, limit: Int = 10): ProjectPagination @requireAnyScope(scopes: ["project:read","project:write"])
  project(_id: ID!): Project @requireAnyScope(scopes: ["project:read","project:write"])
 }

 type Mutation{
  createProject(projectInput: ProjectInput!): Project @requireScope(scope: "project:write")
  updateProject(_id: ID!, projectInput: ProjectInput!): Project @requireScope(scope: "project:write")
  deleteProject(_id: ID!): Boolean @requireScope(scope: "project:write")
 }
`;

