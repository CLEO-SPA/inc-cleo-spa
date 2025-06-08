import { Request, Response, NextFunction } from 'express';
import serviceModel from '../models/serviceModel.js';

// Get all services
const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const services = await serviceModel.getAllServices();
    res.status(200).json(services);
    if (!services || services.length === 0) {
      res.status(404).json({ message: 'Services not found' });
      return;
    }
  }catch(error){
    console.error('Error in getAllServices:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
}

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

// Get a service details by ID (include both enabled and disabled services)
const getServiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid service ID' });
      return;
    }

    const service = await serviceModel.getServiceById(id);

    if (!service || service.length === 0) {
      res.status(404).json({ message: 'Service not found' });
      return;
    }

    res.status(200).json(service[0]); // Assuming only one row is returned
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};

// Get a single enabled service by ID
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
  getAllServices,
  getAllServicesForDropdown,
  getServiceById,
  getEnabledServiceById,
};
