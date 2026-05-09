export const activityResolvers = {
    Query: {
        activities: async (_, { page = 1, limit = 10 }, { req, res, user }, info) => {
            const totalDocuments = await ActivityModel.countDocuments({ project: { $in: user.projects }});
            const totalPages = Math.ceil(totalDocuments / limit);
            const activities = await ActivityModel.find({ project: { $in: user.projects } }).skip((page - 1) * limit).limit(limit);
            return { data: activities, metaData: { page, limit, totalPages, totalDocuments } };
        },
        activity: async (_, { _id }, { req, res, user }, info) => {
            const activity = await ActivityModel.findOne({ project: { $in: user.projects },_id: _id });
            if (!activity) throw new GraphQLError("Activity not found", { extensions: { code: 'ACTIVITY_NOT_FOUND' } });
            return activity;
        }
    },
    Mutation: {
        createActivity: async (_, { activityInput }, { req, res, user }, info) => {
            const project = await ProjectModel.findOne({ _id: activityInput.project, _id: { $in: user.projects } });
            if (!project) throw new GraphQLError("Project not found", { extensions: { code: 'PROJECT_NOT_FOUND' } });
            const activity = await ActivityModel.create({ ...activityInput, project: project._id, createdBy: user._id });
            if (!activity) throw new GraphQLError("Activity not created", { extensions: { code: 'ACTIVITY_NOT_CREATED' } });
            return activity;
        },
        updateActivity: async (_, { _id, activityInput }, { req, res, user }, info) => {
            const project = await ProjectModel.findOne({ _id: activityInput.project, _id: { $in: user.projects } });
            if (!project) throw new GraphQLError("Project not found", { extensions: { code: 'PROJECT_NOT_FOUND' } });
            const activity = await ActivityModel.findByIdAndUpdate(_id, { ...activityInput, project: project._id, updatedBy: user._id }, { new: true });
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