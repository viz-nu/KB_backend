import { SpanModel } from "../../models/Span.js";
import { ActivityModel } from "../../models/Activity.js";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
import { GraphQLError } from "graphql";
export const activityResolvers = {
    Query: {
        activities: async (_, { page = 1, limit = 10, status, span, project, createdBy, fromDate, toDate }, { req, res, user }, info) => {
            const filters = { span: { $in: user.spans } };
            if (fromDate || toDate) {
                filters.createdAt = {};
                if (fromDate) filters.createdAt.$gte = new Date(fromDate);
                if (toDate) {
                    const endDate = new Date(toDate);
                    endDate.setHours(23, 59, 59, 999);
                    filters.createdAt.$lte = endDate;
                }
            }
            if (status) filters.status = status;
            if (span) filters.span = { $in: span };
            if (project) filters.project = { $in: project };
            if (createdBy) filters.createdBy = { $in: createdBy };
            const totalDocuments = await ActivityModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = ActivityModel.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
            const activityFields = getRequestedFieldNames(info, ['data']);
            if (activityFields.has("span")) query = query.populate({ path: 'span', model: "Span" });
            if (activityFields.has("project")) query = query.populate({ path: 'project', model: "Project" });
            if (activityFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (activityFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            const activities = await query;
            return { data: activities, PaginationMetaData: { page, limit, totalPages, totalDocuments } };
        },
        activitiesFacet: async (_, { status, span, project, createdBy }, { req, res, user }, info) => {
            const filters = { span: { $in: user.spans } };
            if (status) filters.status = status;
            if (span) filters.span = { $in: span };
            if (project) filters.project = { $in: project };
            if (createdBy) filters.createdBy = { $in: createdBy };
            const [facets] = await ActivityModel.aggregate([
                { $match: filters },
                {
                    $facet: {
                        // Count by status
                        statusCount: [
                            {
                                $group: {
                                    _id: "$status",
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    status: "$_id",
                                    count: 1
                                }
                            },
                            {
                                $sort: { status: 1 }
                            }
                        ],

                        // Count by project with project name
                        projectCount: [
                            {
                                $group: {
                                    _id: "$project",
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $lookup: {
                                    from: "projects",
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "project"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$project",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    project: {
                                        _id: "$_id",
                                        name: "$project.name",
                                        code: "$project.code"
                                    },
                                    count: 1
                                }
                            },
                            {
                                $sort: { count: -1 }
                            }
                        ],

                        // Count by creator with user details
                        createdByCount: [
                            {
                                $group: {
                                    _id: "$createdBy",
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "user"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$user",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    createdBy: {
                                        _id: "$_id",
                                        name: "$user.name",
                                        email: "$user.email",
                                        designation: "$user.designation"
                                    },
                                    count: 1
                                }
                            },
                            {
                                $sort: { count: -1 }
                            }
                        ],
                        // Count by span with span details
                        spanCount: [
                            {
                                $group: {
                                    _id: "$span",
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $lookup: {
                                    from: "spans",
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "span"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$span",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    span: {
                                        _id: "$_id",
                                        name: "$span.name",
                                        startPoint: "$span.startPoint.placeName",
                                        endPoint: "$span.endPoint.placeName"
                                    },
                                    count: 1
                                }
                            },
                            {
                                $sort: { count: -1 }
                            }
                        ],
                        // Total count
                        totalDocuments: [
                            {
                                $count: "count"
                            }
                        ]
                    }
                },
                {
                    $project: {
                        statusCount: 1,
                        projectCount: 1,
                        createdByCount: 1,
                        spanCount: 1,
                        totalDocuments: {
                            $ifNull: [
                                { $arrayElemAt: ["$totalDocuments.count", 0] },
                                0
                            ]
                        }
                    }
                }
            ]);

            return (facets || { statusCount: [], projectCount: [], createdByCount: [], spanCount: [], totalDocuments: 0 });
        },
        activity: async (_, { _id }, { req, res, user }, info) => {
            const activity = await ActivityModel.findOne({ $and: [{ _id: _id }, { project: { $in: user.projects } }] });
            if (!activity) throw new GraphQLError("Activity not found", { extensions: { code: 'ACTIVITY_NOT_FOUND' } });
            return activity;
        }
    },
    Mutation: {
        createActivity: async (_, { activityInput }, { req, res, user }, info) => {
            const { spanId, lineItems, locationDescription, remarks } = activityInput
            const span = await SpanModel.findOne({ $and: [{ _id: spanId }, { _id: { $in: user.spans } }] });
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'Spans' } });
            const activity = await ActivityModel.create({ lineItems, locationDescription, remarks, span: spanId, project: span.project, createdBy: user._id });
            if (!activity) throw new GraphQLError("Activity not created", { extensions: { code: 'ACTIVITY_NOT_CREATED' } });
            return activity;
        },
        updateActivityStatus: async (_, { _id, statusUpdateInput }, { req, res, user }, info) => {
            const { status, note } = statusUpdateInput;
            const activity = await ActivityModel.findByIdAndUpdate(_id, { status, $push: { remarks: { createdBy: user._id, notes: note } } }, { new: true });
            if (!activity) throw new GraphQLError("Activity not updated", { extensions: { code: 'ACTIVITY_NOT_UPDATED' } });
            return activity;
        },
        updateActivity: async (_, { _id, lineItems }, { req, res, user }, info) => {
            const activity = await ActivityModel.findOneAndUpdate({ $and: [{ _id: _id }, { createdBy: user._id }] }, {status:"SUBMITTED", lineItems, updatedBy: user._id }, { new: true });
            if (!activity) throw new GraphQLError("Activity not updated", { extensions: { code: 'ACTIVITY_NOT_UPDATED' } });
            return activity;
        },
        deleteActivity: async (_, { _id }, { req, res, user }, info) => {
            const activity = await ActivityModel.findOne({ $and: [{ _id: _id }, { project: { $in: user.projects } }] });
            if (!activity) throw new GraphQLError("Activity not found", { extensions: { code: 'ACTIVITY_NOT_FOUND' } });
            const deletedActivity = await ActivityModel.findByIdAndDelete(_id);
            return true;
        }
    }
};