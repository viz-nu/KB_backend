import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../middleware/auth.js";
import { UserModel } from "../../models/User.js";
import bcrypt from "bcrypt";
import { GraphQLError } from "graphql";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
import { ProjectModel } from "../../models/Project.js";
export const userResolvers = {
    Query: {
        me: async (_, { }, { req, res, user }, info) => {
            return user;
        },
        users: async (_, { page = 1, limit = 10, projects, isActive = true, role, includeSelf = true }, { req, res, user }, info) => {            
            let filters = includeSelf ? {} : { _id: { $ne: user._id } };
            if (projects) filters.projects = { $in: projects };
            if (typeof isActive === "boolean") filters.isActive = isActive;
            if (role) filters.role = role;
            const totalDocuments = await UserModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = UserModel.find(filters).skip((page - 1) * limit).limit(limit);
            const userFields = getRequestedFieldNames(info, ['data']);
            if (userFields.has("projects")) query = query.populate({ path: 'projects', model: "Project" });
            const users = await query;
            return { data: users, metaData: { page, limit, totalPages, totalDocuments } };
        },
        user: async (_, { _id }, { req, res, user }, info) => {
            const User = await UserModel.findById(_id);
            if (!User) throw new GraphQLError("User not found", { extensions: { code: 'USER_NOT_FOUND' } });
            return User;
        }
    },
    Mutation: {
        login: async (_, { email, password }, { req, res }, info) => {
            const user = await UserModel.findOne({ email });
            if (!user) throw new GraphQLError("User not found", { extensions: { code: 'USER_NOT_FOUND' } });
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) throw new GraphQLError("Invalid password", { extensions: { code: 'INVALID_PASSWORD' } });
            const accessToken = await generateAccessToken(user, req.headers['user-agent']);
            const refreshToken = await generateRefreshToken(user, req.headers['user-agent']);
            return { accessToken, refreshToken, user };
        },
        createUser: async (_, { userInput }, { req, res, user }, info) => {
            if (userInput.projects) {
                const projects = await ProjectModel.find({ _id: { $in: userInput.projects } });
                if (projects.length !== userInput.projects.length) throw new GraphQLError("Projects not found", { extensions: { code: 'PROJECTS_NOT_FOUND' } });
                userInput.projects = projects.map(project => project._id);
            }
            userInput.createdBy = user._id;
            const newUser = await UserModel.create(userInput);
            return newUser;
        },
        updateUser: async (_, { _id, userInput }, { req, res, user }, info) => {
            if (userInput.projects) {
                const projects = await ProjectModel.find({ _id: { $in: userInput.projects } });
                if (projects.length !== userInput.projects.length) throw new GraphQLError("Projects not found", { extensions: { code: 'PROJECTS_NOT_FOUND' } });
                userInput.projects = projects.map(project => project._id);
            }
            const UpdatedUser = await UserModel.findByIdAndUpdate(_id, { ...userInput, updatedBy: user._id }, { new: true });
            if (!UpdatedUser) throw new GraphQLError("User not found", { extensions: { code: 'USER_NOT_FOUND' } });
            return UpdatedUser;
        },
        newAccessToken: async (_, { refreshToken }, { req, res }, info) => {
            const verifyRefreshTokenResult = await verifyRefreshToken(refreshToken);
            if (!verifyRefreshTokenResult.success) throw new GraphQLError(verifyRefreshTokenResult.error.message, { extensions: { code: verifyRefreshTokenResult.error.name } });
            const { decoded, user } = verifyRefreshTokenResult;
            return await generateAccessToken(user, req.headers['user-agent']);;
        }
    }
};