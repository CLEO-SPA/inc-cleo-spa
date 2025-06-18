import { Request, Response, NextFunction } from 'express';
import serviceModel from '../models/serviceModel.js';

// Get all enabled services for dropdown
const getAllServicesForDropdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await serviceModel.getAllServicesForDropdown();
    res.status(200).json(services);
  } catch (error) {
    console.error('Error in getAllServicesForDropdown:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
};

// Get a single active service by ID
const getEnabledServiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid service ID' });
      return;
    }

    const service = await serviceModel.getEnabledServiceById(id);

    if (!service || service.length === 0) {
      res.status(404).json({ message: 'Service not found or not active' });
      return;
    }

    res.status(200).json(service[0]); // Assuming only one row is returned
  } catch (error) {
    console.error('Error in getEnabledServiceById:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};

export default {
  getAllServicesForDropdown,
  getEnabledServiceById,
};
