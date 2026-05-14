import { GraphQLError } from "graphql";
import { ProjectModel } from "../../models/Project.js";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
import { ChapterModel } from "../../models/Chapters.js";
import mongoose from "mongoose";
export const projectResolvers = {
    Query: {
        projects: async (_, { page = 1, limit = 10 }, { req, res, user }, info) => {
            let filters = { _id: { $in: user.projects } };
            const totalDocuments = await ProjectModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = ProjectModel.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
            const projectFields = getRequestedFieldNames(info, ['data']);
            if (projectFields.has("chapters")) query = query.populate({ path: 'chapters', model: "Chapter" });
            if (projectFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (projectFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            const projects = await query;
            return { data: projects, PaginationMetaData: { page, limit, totalPages, totalDocuments } };
        },
        project: async (_, { _id }, { req, res, user }, info) => {
            let query = ProjectModel.findOne({ $and: [{ _id: _id }, { _id: { $in: user.projects } }] });
            const projectFields = getRequestedFieldNames(info, ['data']);
            if (projectFields.has("chapters")) query = query.populate({ path: 'chapters', model: "Chapter" });
            if (projectFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (projectFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            const project = await query;
            return project;
        }
    },
    Mutation: {
        createProject: async (_, { projectInput }, { req, res, user }, info) => {
            const { chapters, name, code, description, Vault, status } = projectInput;
            const project = await ProjectModel.create({ name, code, description, Vault, status, createdBy: user._id });
            const createdChapters = await ChapterModel.insertMany(
                chapters.map(({ _id, ...chapter }) => ({
                    ...chapter,
                    project: project._id,
                    createdBy: user._id
                }))
            );
            project.chapters = createdChapters.map(ch => ch._id);
            await project.addStaff(user._id);
            await project.save();
            return project;
        },
        updateProject: async (_, { _id, projectInput }, { req, res, user }, info) => {
            const { chapters = [], name, code, description, Vault, status } = projectInput;
            let chapterIds = [];
            let project = await ProjectModel.findOne({ $and: [{ _id: _id }, { _id: { $in: user.projects } }] });
            if (!project) throw new GraphQLError("Project not found", { extensions: { code: 'PROJECT_NOT_FOUND' } });
            // Update existing chapters or create new ones
            for (const chapter of chapters) {
                let savedChapter = null;
                if (chapter._id && mongoose.Types.ObjectId.isValid(chapter._id)) {
                    const { _id: chapterId, ...data } = chapter;
                    savedChapter = await ChapterModel.findByIdAndUpdate(chapterId, { ...data, project: _id, updatedBy: user._id }, { new: true, runValidators: true });
                }
                if (!savedChapter) {
                    const { _id: ignoredId, ...data } = chapter;
                    savedChapter = await ChapterModel.create({ ...data, project: _id, createdBy: user._id, updatedBy: user._id });
                }
                chapterIds.push(savedChapter._id);
            }
            const chaptersToRemove = project.chapters.filter(existingId => !chapterIds.some(newId => newId.toString() === existingId.toString()));
            await ChapterModel.deleteMany({ _id: { $in: chaptersToRemove } });
            const updateData = { name, code, description, Vault, status, updatedBy: user._id };
            if (chapters.length > 0) updateData.chapters = chapterIds;
            project = await ProjectModel.findByIdAndUpdate(_id, updateData, { new: true });
            return project;
        },
        deleteProject: async (_, { _id }, { req, res, user }, info) => {
            await ProjectModel.findByIdAndDelete(_id);
            return true;
        }
    }
};