export const userTypeDefs = `#graphql

type User {
    _id: ID
    spans: [Span]
    name: String
    designation: String
    email: String
    role: String
    scopes: [String]
    projects: [Project]
    isActive: Boolean
}
input UserInput {
    projects: [ID]
    spans: [ID]
    name: String
    designation: String
    email: String
    role: String
    scopes: [String]
    password: String
}
type LoginResponse {
    accessToken: String
    refreshToken: String
    user : User
}
 type UserPagination {
    data: [User]
    PaginationMetaData: PaginationMetaData
 }
type Query{
    users(page: Int = 1, limit: Int = 10 projects: [ID], isActive: Boolean, role: String, includeSelf: Boolean = false): UserPagination @requireAnyScope(scopes: ["user:read","user:write"])
    me: User @requireAnyScope(scopes: ["user:read","user:write"])
    user(_id: ID!): User @requireAnyScope(scopes: ["user:read","user:write"])
 }
type Mutation{
    login(email: String!, password: String!): LoginResponse
    createUser(userInput: UserInput!): User @requireScope(scope: "user:write")
    newAccessToken(refreshToken: String!): String
    updateUser(_id: ID!, userInput: UserInput): User @requireScope(scope: "user:write")
 }
`;

