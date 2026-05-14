import { SpanModel } from "../../models/Span.js";
import { ActivityModel } from "../../models/Activity.js";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
export const activityResolvers = {
    Query: {
        activities: async (_, { page = 1, limit = 10, status }, { req, res, user }, info) => {
            const filters = { span: { $in: user.spans } };
            if (status) filters.status = status;
            const totalDocuments = await ActivityModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = ActivityModel.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
            const activityFields = getRequestedFieldNames(info, ['data']);
            if (activityFields.has("span")) query = query.populate({ path: 'span', model: "Span" });
            if (activityFields.has("project")) query = query.populate({ path: 'project', model: "Project" });
            if (activityFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (activityFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            const activities = await query;
            return { data: activities, metaData: { page, limit, totalPages, totalDocuments } };
        },
        activity: async (_, { _id }, { req, res, user }, info) => {
            const activity = await ActivityModel.findOne({ project: { $in: user.projects }, _id: _id });
            if (!activity) throw new GraphQLError("Activity not found", { extensions: { code: 'ACTIVITY_NOT_FOUND' } });
            return activity;
        }
    },
    Mutation: {
        createActivity: async (_, { activityInput }, { req, res, user }, info) => {
            const { spanId, lineItems, locationDescription, remarks, WorkCategory } = activityInput
            const span = await SpanModel.findOne({ _id: spanId, _id: { $in: user.spans } });
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'Spans' } });
            const activity = await ActivityModel.create({ lineItems, locationDescription, remarks, WorkCategory, span: spanId, project: span.project, createdBy: user._id });
            if (!activity) throw new GraphQLError("Activity not created", { extensions: { code: 'ACTIVITY_NOT_CREATED' } });
            return activity;
        },
        updateActivity: async (_, { _id, activityInput }, { req, res, user }, info) => {
            const span = await SpanModel.findOne({ _id: activityInput.spanId, _id: { $in: user.spans } });
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'Spans' } });
            const activity = await ActivityModel.findByIdAndUpdate(_id, { ...activityInput, updatedBy: user._id }, { new: true });
            if (!activity) throw new GraphQLError("Activity not updated", { extensions: { code: 'ACTIVITY_NOT_UPDATED' } });
            return activity;
        },
        deleteActivity: async (_, { _id }, { req, res, user }, info) => {
            const activity = await ActivityModel.findOne({ project: { $in: user.projects }, _id: _id });
            if (!activity) throw new GraphQLError("Activity not found", { extensions: { code: 'ACTIVITY_NOT_FOUND' } });
            const deletedActivity = await ActivityModel.findByIdAndDelete(_id);
            return true;
        }
    }
};