export const spanTypeDefs = `#graphql
enum SpanStatusEnum {
    IN_PROGRESS
    COMPLETED
    CANCELLED
    PENDING
}
type terminal {
    placeName: String
    pointLocation: PointLocation
}
type Span {
_id: ID
project: Project
name: String
startPoint: terminal
endPoint: terminal
status: SpanStatusEnum
chapters: [Chapter]
Vault: Vault
createdBy: User
staff: [User]
createdAt: DateTime
updatedAt: DateTime
}
input terminalInput {
    placeName: String!
    pointLocation: PointLocationInput!
}
input SpanInput {
    project: ID!
    name: String!
    startPoint: terminalInput!
    endPoint: terminalInput!
    status: SpanStatusEnum
    chapters: [ChapterInput]
    Vault: VaultInput
}
 type SpanPagination {
    data: [Span]
    PaginationMetaData: PaginationMetaData
 }
 type Query{
    spans(page: Int = 1, limit: Int = 10, project: ID, status: SpanStatusEnum): SpanPagination @requireAnyScope(scopes: ["span:read","span:write"])
    span(_id: ID!): Span @requireAnyScope(scopes: ["span:read","span:write"])
 }
 type Mutation{ 
    createSpan(spanInput: SpanInput!): Span @requireScope(scope: "span:write")
    updateSpan(_id: ID!, name: String, startPoint: terminalInput, endPoint: terminalInput, status: SpanStatusEnum): Span @requireScope(scope: "span:write")
    addStaff(_id: ID!, userID: ID!): Span @requireScope(scope: "span:write")
    removeStaff(_id: ID!, userID: ID!): Span @requireScope(scope: "span:write")
 }
`;