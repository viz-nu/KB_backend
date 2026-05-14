import { GraphQLError } from "graphql";
import { ProjectModel } from "../../models/Project.js";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
export const projectResolvers = {
    Query: {
        projects: async (_, { page = 1, limit = 10 }, { req, res, user }, info) => {
            let filters = { _id: { $in: user.projects } };
            const totalDocuments = await ProjectModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = ProjectModel.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
            const projectFields = getRequestedFieldNames(info, ['data']);
            if (projectFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (projectFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            const projects = await query;
            return { data: projects, metaData: { page, limit, totalPages, totalDocuments } };
        },
        project: async (_, { _id }, { req, res, user }, info) => {
            const project = await ProjectModel.findOne({ $and: [{ _id: _id }, { _id: { $in: user.projects } }] });
            if (!project) throw new GraphQLError("Project not found", { extensions: { code: 'PROJECT_NOT_FOUND' } });
            return project;
        }
    },
    Mutation: {
        createProject: async (_, { projectInput }, { req, res, user }, info) => {
            const project = await ProjectModel.create({ ...projectInput, createdBy: user._id });
            user.projects.push(project._id);
            await user.save();
            return project;
        },
        updateProject: async (_, { _id, projectInput }, { req, res, user }, info) => {
            const project = await ProjectModel.findByIdAndUpdate(_id, { ...projectInput, updatedBy: user._id }, { new: true });
            return project;
        },
        deleteProject: async (_, { _id }, { req, res, user }, info) => {
            await ProjectModel.findByIdAndDelete(_id);
            return true;
        }
    }
};