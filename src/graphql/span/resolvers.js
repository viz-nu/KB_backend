import { GraphQLError } from "graphql";
import { ProjectModel } from "../../models/Project.js";
import { SpanModel } from "../../models/Span.js";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
export const spanResolvers = {
    Query: {
        spans: async (_, { page = 1, limit = 10, project, status }, { req, res, user }, info) => {
            let filters = { _id: { $in: user.spans } };
            if (project) filters.project = project;
            if (status) filters.status = status;
            const totalDocuments = await SpanModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = SpanModel.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
            const spanFields = getRequestedFieldNames(info, ['data']);
            if (spanFields.has("project")) query = query.populate({ path: 'project', model: "Project" });
            if (spanFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (spanFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            if (spanFields.has("staff")) query = query.populate({ path: 'staff', model: "User" });
            const spans = await query;
            return { data: spans, metaData: { page, limit, totalPages, totalDocuments } };
        },
        span: async (_, { _id }, { req, res, user }, info) => {
            let query = SpanModel.findOne({ $and: [{ _id: _id }, { _id: { $in: user.spans } }] });
            const spanFields = getRequestedFieldNames(info);
            if (spanFields.has("project")) query = query.populate({ path: 'project', model: "Project" });
            if (spanFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (spanFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            if (spanFields.has("staff")) query = query.populate({ path: 'staff', model: "User" });
            const span = await query;
            return span;
        }
    },
    Mutation: {
        createSpan: async (_, { spanInput }, { req, res, user }, info) => {
            const { project, name, startPoint, endPoint, chapters, Vault } = spanInput;
            const Project = await ProjectModel.findOne({ _id: project, _id: { $in: user.projects } });
            if (!Project) throw new GraphQLError("Project not found", { extensions: { code: 'PROJECT_NOT_FOUND' } });
            const span = await SpanModel.create({ name, startPoint, endPoint, chapters, Vault, project: Project._id, createdBy: user._id });
            user.spans.push(span._id);
            await user.save();
            return span;
        },
        updateSpan: async (_, { _id, spanInput }, { req, res, user }, info) => {
            const { name, startPoint, endPoint, chapters, Vault, status } = spanInput;
            if (!user.spans.includes(_id)) throw new GraphQLError("You are not authorized to update this span", { extensions: { code: 'UNAUTHORIZED' } });
            const span = await SpanModel.findById(_id);
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'SPAN_NOT_FOUND' } });
            if (name) span.name = name;
            if (startPoint) span.startPoint = startPoint;
            if (endPoint) span.endPoint = endPoint;
            if (chapters) span.chapters = chapters;
            if (Vault) span.Vault = Vault;
            if (status) span.status = status;
            span.updatedBy = user._id;
            await span.save();
            return span;
        },
        addStaff: async (_, { _id, userID }, { req, res, user }, info) => {
            const span = await SpanModel.findById(_id);
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'SPAN_NOT_FOUND' } });
            await span.addStaff(userID);
            return span;
        },
        removeStaff: async (_, { _id, userID }, { req, res, user }, info) => {
            const span = await SpanModel.findById(_id);
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'SPAN_NOT_FOUND' } });
            await span.removeStaff(userID);
            return span;
        }
    }
};