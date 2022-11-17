const Task = require('../../model/task-model')
const { USER_PUBLIC_INFO } = require('../../config/config')
const { usersExists } = require('../user/utils')

exports.populateParticipants = [
  {
    path: 'participants',
    populate: {
      path: 'user',
      select: USER_PUBLIC_INFO,
    },
  },
  {
    path: 'owner completedBy',
    select: USER_PUBLIC_INFO,
  },
]

exports.getUsersAllTaskFilter = (userId, active = true) => {
  return {
    $or: [
      { owner: userId },
      {
        participants: {
          $elemMatch: { user: userId, active },
        },
      },
    ],
  }
}

const getUsersTaskFilter = (taskId, ...args) => {
  return {
    $and: [
      {
        _id: taskId,
      },
      this.getUsersAllTaskFilter(...args),
    ],
  }
}
exports.getUsersTaskFilter = getUsersTaskFilter

exports.sanitizeParticipant = async (taskBody) => {
  const list = taskBody.participants
  if (!list) return
  const userIds = []

  const okList = list.map((participants) => {
    if (participants.user.toString() === taskBody.owner.toString()) {
      throw new ReqError('You can not invite the owner for a task')
    }

    userIds.push(participants.user)
    participants.active = false
    return participants
  })

  if (new Set(userIds).size !== userIds.length) {
    throw new ReqError('Duplicate input')
  }

  if (!(await usersExists(userIds))) {
    throw new ReqError('All the users does not exists')
  }

  return okList
}

exports.saveAndGetTask = async (task) => {
  const savedTask = await task.save()
  return savedTask.populate(this.populateParticipants)
}

exports.isTaskExists = async (taskId, userId) => {
  const filter = getUsersTaskFilter(taskId, userId, true)
  return Task.exists(filter)
}
