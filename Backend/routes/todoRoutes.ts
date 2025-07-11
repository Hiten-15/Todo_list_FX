import express from 'express';
import Task from '../models/Task';
import { auth } from '../middleware/auth';
import mongoose from 'mongoose';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

const router = express.Router();

// Get tasks
router.get('/', auth, async (req: any, res) => {
  console.log('📋 Fetching tasks for user:', req.user?.id);
  try {
    const tasks = await Task.find({ userId: req.user.id });
    console.log('✅ Found', tasks.length, 'tasks');
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add task
router.post('/', auth, async (req: any, res) => {
  console.log('➕ Adding new task for user:', req.user?.id, 'Text:', req.body.text);
  try {
    const task = new Task({ userId: req.user.id, text: req.body.text, completed: false });
    await task.save();
    console.log('✅ Task saved with ID:', task._id);
    res.status(201).json(task);
  } catch (error) {
    console.error('❌ Error adding task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add sub-task
router.post('/:taskId/subtask', auth, async (req, res) => {
  console.log('🔗 Adding sub-task to task:', req.params.taskId, 'Text:', req.body.text, 'User:', req.user?.id);
  try {
    if (!req.user) {
      console.log('❌ Unauthorized: No user found');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log('🔍 Searching:', req.user);
    const mainTask = await Task.findOne({_id: req.params.taskId, userId: req.user.id });
    if (!mainTask) {
      console.log('❌ Main task not found:', req.params.taskId);
      return res.status(404).json({ message: 'Main task not found' });
    }
    console.log('✅ Found main task, adding sub-task');
    const subTask = {
      _id: new mongoose.Types.ObjectId().toString(),
      text: req.body.text,
      completed: false
    };
    mainTask.subTasks.push(subTask);
    await mainTask.save();
    console.log('✅ Sub-task added successfully, ID:', subTask._id);
    res.status(201).json(subTask);
  } catch (error) {
    console.error('❌ Error adding sub-task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update PATCH to mark main and sub-tasks as done
router.patch('/:id', auth, async (req, res) => {
  console.log("✅ Marking task as done - ID:", req.params.id, "User:", req.user?.id);
  try {
    let task;
    if (!req.user) {
      console.log('❌ Unauthorized: No user found');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    task = await Task.findOne({_id: req.params.id, userId: req.user.id });
    if (task) {
      console.log('✅ Found task, marking as completed');
      task.completed = true;
      if (task.subTasks && task.subTasks.length > 0) {
        console.log('🔄 Marking', task.subTasks.length, 'sub-tasks as completed');
        task.subTasks.forEach(st => { st.completed = true; });
      }
      await task.save();
      console.log('✅ Task and sub-tasks marked as completed');
    }
    if (!task) {
      console.log('❌ Task not found:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('❌ Error marking task as done:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update DELETE to remove main and sub-tasks
router.delete('/:id', auth, async (req, res) => {
  console.log("🗑️  Deleting task - ID:", req.params.id, "User:", req.user?.id);
  try {
    let success;
    if (!req.user) {
      console.log('❌ Unauthorized: No user found');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const task = await Task.findOneAndDelete({_id: req.params.id, userId: req.user.id });
    success = !!task;
    if (success) {
      console.log('✅ Task deleted successfully');
    } else {
      console.log('❌ Task not found for deletion');
    }
    if (!success) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark sub-task as done
router.patch('/:taskId/subtask/:subTaskId', auth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const task = await Task.findOne({ _id: req.params.taskId, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Find sub-task by _id or id
    const subTask = task.subTasks.id?.(req.params.subTaskId) || task.subTasks.find(st => st._id === req.params.subTaskId || st.id === req.params.subTaskId);
    if (!subTask) return res.status(404).json({ message: 'Sub-task not found' });

    subTask.completed = true;
    await task.save();
    res.json(subTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete sub-task
router.delete('/:taskId/subtask/:subTaskId', auth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const task = await Task.findOne({ _id: req.params.taskId, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Remove sub-task by _id or id using Mongoose's pull method
    task.subTasks.pull({ _id: req.params.subTaskId });
    await task.save();
    res.json({ message: 'Sub-task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
