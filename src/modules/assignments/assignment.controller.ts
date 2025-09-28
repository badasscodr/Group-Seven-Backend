import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  getAllAssignments,
  getEmployeeAssignments,
  createAssignment,
  updateAssignmentStatus,
  getAssignmentTasks,
  createTask,
  updateTaskProgress
} from './assignment.service';

// Project Controllers
export const getProjectsController = async (req: Request, res: Response) => {
  try {
    const projects = await getAllProjects();

    res.status(200).json({
      success: true,
      data: projects,
      message: 'Projects retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve projects'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getProjectController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve project'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const createProjectController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectData = req.body;
    const createdBy = req.user!.sub;

    const project = await createProject(projectData, createdBy);

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create project'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateProjectController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await updateProject(id, updateData);

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Project not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'Project not found' ? 'PROJECT_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to update project'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Assignment Controllers
export const getAssignmentsController = async (req: Request, res: Response) => {
  try {
    const assignments = await getAllAssignments();

    res.status(200).json({
      success: true,
      data: assignments,
      message: 'Assignments retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve assignments'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getEmployeeAssignmentsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;
    const assignments = await getEmployeeAssignments(employeeId);

    res.status(200).json({
      success: true,
      data: assignments,
      message: 'Employee assignments retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve employee assignments'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const createAssignmentController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignmentData = req.body;
    const assignedBy = req.user!.sub;

    const assignment = await createAssignment(assignmentData, assignedBy);

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('not an employee') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' :
              statusCode === 400 ? 'INVALID_EMPLOYEE' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to create assignment'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateAssignmentStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const assignment = await updateAssignmentStatus(id, status);

    res.status(200).json({
      success: true,
      data: assignment,
      message: 'Assignment status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Assignment not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'Assignment not found' ? 'ASSIGNMENT_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to update assignment status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Task Controllers
export const getTasksController = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const tasks = await getAssignmentTasks(assignmentId);

    res.status(200).json({
      success: true,
      data: tasks,
      message: 'Tasks retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve tasks'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const createTaskController = async (req: Request, res: Response) => {
  try {
    const taskData = req.body;
    const task = await createTask(taskData);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Assignment not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'Assignment not found' ? 'ASSIGNMENT_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to create task'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateTaskController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completion_percentage, actual_hours } = req.body;

    const task = await updateTaskProgress(id, completion_percentage, actual_hours);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Task not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'Task not found' ? 'TASK_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to update task'
      },
      timestamp: new Date().toISOString()
    });
  }
};