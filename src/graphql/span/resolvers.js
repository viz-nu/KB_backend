import { GraphQLError } from "graphql";
import { ProjectModel } from "../../models/Project.js";
import { SpanModel } from "../../models/Span.js";
import { getRequestedFieldNames } from "../utils/requestedFields.js";
export const spanResolvers = {
    Query: {
        spans: async (_, { page = 1, limit = 10, projects, status, startPoints, endPoints    }, { req, res, user }, info) => {
            let filters = { _id: { $in: user.spans } };
            if (projects?.length) filters.project = { $in: projects };
            if (startPoints?.length) filters.startPoint = { placeName: { $in: startPoints } };
            if (endPoints?.length) filters.endPoint = { placeName: { $in: endPoints } };
            if (status) filters.status = status;
            const totalDocuments = await SpanModel.countDocuments(filters);
            const totalPages = Math.ceil(totalDocuments / limit);
            let query = SpanModel.find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
            const spanFields = getRequestedFieldNames(info, ['data']);
            if (spanFields.has("project")) query = query.populate({ path: 'project', model: "Project" });
            if (spanFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (spanFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            if (spanFields.has("chapters")) query = query.populate({ path: 'chapters', model: "Chapter" });
            if (spanFields.has("staff")) query = query.populate({ path: 'staff', model: "User" });
            const spans = await query;
            return { data: spans, PaginationMetaData: { page, limit, totalPages, totalDocuments } };
        },
        spansFacet: async (_, { projects, status, startPoint, endPoint }, { user }) => {
            // Build filters
            const filters = {
              _id: { $in: user.spans }
            };
          
            if (projects?.length) {
              filters.project = { $in: projects };
            }
          
            if (status) {
              filters.status = status;
            }
          
            if (startPoint) {
              filters["startPoint.placeName"] = startPoint;
            }
          
            if (endPoint) {
              filters["endPoint.placeName"] = endPoint;
            }
          
            const [facets] = await SpanModel.aggregate([
              { $match: filters },
          
              {
                $facet: {
                  // Status counts
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
          
                  // Project counts
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
          
                  // Start point counts
                  startPointCount: [
                    {
                      $group: {
                        _id: "$startPoint.placeName",
                        count: { $sum: 1 }
                      }
                    },
                    {
                      $project: {
                        _id: 0,
                        startPoint: "$_id",
                        count: 1
                      }
                    },
                    {
                      $sort: { count: -1 }
                    }
                  ],
          
                  // End point counts
                  endPointCount: [
                    {
                      $group: {
                        _id: "$endPoint.placeName",
                        count: { $sum: 1 }
                      }
                    },
                    {
                      $project: {
                        _id: 0,
                        endPoint: "$_id",
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
                  startPointCount: 1,
                  endPointCount: 1,
                  totalDocuments: {
                    $ifNull: [
                      { $arrayElemAt: ["$totalDocuments.count", 0] },
                      0
                    ]
                  }
                }
              }
            ]);
          
            return (
              facets || {
                statusCount: [],
                projectCount: [],
                startPointCount: [],
                endPointCount: [],
                totalDocuments: 0
              }
            );
          },
        span: async (_, { _id }, { req, res, user }, info) => {
            let query = SpanModel.findOne({ $and: [{ _id: _id }, { _id: { $in: user.spans } }] });
            const spanFields = getRequestedFieldNames(info);
            if (spanFields.has("project")) query = query.populate({ path: 'project', model: "Project" });
            if (spanFields.has("createdBy")) query = query.populate({ path: 'createdBy', model: "User" });
            if (spanFields.has("updatedBy")) query = query.populate({ path: 'updatedBy', model: "User" });
            if (spanFields.has("staff")) query = query.populate({ path: 'staff', model: "User" });
            if (spanFields.has("chapters")) query = query.populate({ path: 'chapters', model: "Chapter" });
            const span = await query;
            return span;
        }
    },
    Mutation: {
        createSpan: async (_, { spanInput }, { req, res, user }, info) => {
            const { project, name, startPoint, endPoint, chapters, Vault, TargetedValues } = spanInput;
            const Project = await ProjectModel.findOne({ $and: [{ _id: project }, { _id: { $in: user.projects } }] });
            if (!Project) throw new GraphQLError("Project not found", { extensions: { code: 'PROJECT_NOT_FOUND' } });
            const span = await SpanModel.create({ name, startPoint, endPoint, chapters, Vault, TargetedValues, project: Project._id, createdBy: user._id });
            user.spans.push(span._id);
            await user.save();
            return span;
        },
        updateSpan: async (_, { _id, spanInput }, { req, res, user }, info) => {
            const { name, startPoint, endPoint, chapters, Vault, TargetedValues, status } = spanInput;
            if (!user.spans.includes(_id)) throw new GraphQLError("You are not authorized to update this span", { extensions: { code: 'UNAUTHORIZED' } });
            const span = await SpanModel.findById(_id);
            if (!span) throw new GraphQLError("Span not found", { extensions: { code: 'SPAN_NOT_FOUND' } });
            if (name) span.name = name;
            if (startPoint) span.startPoint = startPoint;
            if (endPoint) span.endPoint = endPoint;
            if (chapters) span.chapters = chapters;
            if (Vault) span.Vault = Vault;
            if (TargetedValues) span.TargetedValues = TargetedValues;
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