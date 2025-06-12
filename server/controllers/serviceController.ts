import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import serviceModel from '../models/serviceModel.js';

// Get all services
const getAllServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await serviceModel.getAllServices();

    if (!services || services.length === 0) {
      res.status(404).json({ message: 'Services not found' });
      return;
    }
    res.status(200).json(services);
  } catch (error) {
    console.error('Error in getAllServices:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
};

function isSafeInput(input: string) {
  // Allow only letters, numbers, spaces, and a few symbols
  return /^[\w\s\,-.&+_()$]+$/.test(input);
}

// Get services with pagination and filter
const getServicesPaginationFilter = async (req: Request, res: Response, next: NextFunction) => {
  console.log('query:');
  console.log(req.query);
  const { page, limit, search, category, status } = req.query;
  try {
    console.log('page:', page, typeof page);
    console.log('limit:', limit, typeof limit);
    console.log('search:', search, typeof search);
    console.log('category:', category, typeof category);
    console.log('status:', status, typeof status);

    const data: { [key: string]: any } = {};

    if (typeof page === 'string' && validator.isInt(page)) {
      data.page = parseInt(page, 10);
    } else {
      data.page = 1;
    }

    if (typeof limit === 'string' && validator.isInt(limit)) {
      data.limit = parseInt(limit, 10);
    } else {
      data.limit = 10;
    }

    if (typeof search === 'string' && isSafeInput(search)) {
      data.search = search;
    } else {
      data.search = null;
    }

    if (typeof category === 'string' && validator.isInt(category) && parseInt(category, 10) != 0) {
      data.category = parseInt(category, 10);
    } else {
      data.category = null;
    }

    if (typeof status === 'string' && validator.isBoolean(status)) {
      data.status = status.toLowerCase() === 'true'; // convert to boolean
    } else {
      data.status = null;
    }

    console.log(data);
    const totalCount = await serviceModel.getTotalCount(data.search, data.category, data.status);
    const totalPages = Math.ceil(totalCount / data.limit);
    const services = await serviceModel.getServicesPaginationFilter(
      data.page,
      data.limit,
      data.search,
      data.category,
      data.status
    );
    res.status(200).json({ totalPages, services });
  } catch (error) {
    console.error('Error in getAllServices:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
};

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
      res.status(404).json({ message: 'Service not found or not enabled' });
      return;
    }

    res.status(200).json(service[0]); // Assuming only one row is returned
  } catch (error) {
    console.error('Error in getEnabledServiceById:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};

const getServiceCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceCategories = await serviceModel.getServiceCategories();

    if (!serviceCategories || serviceCategories.length === 0) {
      res.status(404).json({ message: 'Service categories not found' });
      return;
    }

    res.status(200).json(serviceCategories);
  } catch (error) {
    console.error('Error in getServiceCategories:', error);
    res.status(500).json({ message: 'Failed to fetch service categories' });
  }
};

// create service
// data validation
//Data validation
const validateServiceData = async (req: Request, res: Response, next: NextFunction) => {
  const serviceData = req.body;

  const {
    service_name,
    service_description,
    service_remarks,
    service_duration,
    service_price,
    service_is_enabled,
    service_category_id,
    created_at,
    created_by,
  } = serviceData;

  //Check if all fields are provided
  if (
    !service_name ||
    !service_duration ||
    !service_price ||
    isNaN(service_is_enabled) ||
    !service_category_id ||
    !created_at ||
    !created_by
  ) {
    res.status(400).json({ message: 'Data missing from required fields.' });
    return;
  }

  if (service_name) {
    if (!isSafeInput(service_name.trim())) {
      res.status(400).json({ message: 'Invalid data type' });
      return;
    } else {
      const service = await serviceModel.getServiceByName(serviceData.service_name);
      if (service && service.length > 0) {
        res.status(400).json({ message: 'Service with this name already exists' });
        return;
      }
    }
  }

  if (service_description && !isSafeInput(service_description.trim())) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (service_remarks && !isSafeInput(service_remarks.trim())) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (service_category_id) {
    if (!validator.isInt(service_category_id)) {
      res.status(400).json({ message: 'Invalid data type' });
      return;
    } else {
      const category = await serviceModel.getServiceCategoryById(service_category_id);
      if (!category || category.length === 0) {
        res.status(404).json({ message: 'Service Category not found' });
        return;
      }
    }
  }
  if (!validator.isInt(service_duration) || !validator.isNumeric(service_price)) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (!validator.isBoolean(service_is_enabled.toString())) {
    res.status(400).json({ message: 'Invalid data type' });
    return;
  }

  if (!validator.isISO8601(created_at)) {
    throw new Error('Invalid data type');
  }

  next();
};

const createService = async (req: Request, res: Response, next: NextFunction) => {
  const formData = req.body;
  try {
    // get service sequence no (last in the category)
    const service_sequence_no = parseInt(await serviceModel.getServiceSequenceNo(formData.service_category_id)) + 1;

    // add service_sequence_no, updated_at, updated_by
    const serviceData = {
      ...formData,
      created_at: new Date(formData.created_at).toISOString(),
      service_sequence_no: service_sequence_no,
      updated_by: formData.created_by,
      updated_at: req.session.start_date_utc
        ? new Date(req.session.start_date_utc).toISOString
        : new Date().toISOString(),
    };

    const newService = await serviceModel.createService(serviceData);
    if (newService) {
      res.status(201).json({ service: newService[0], message: 'Service created successfully' });
    } else {
      res.status(400).json({ message: 'Failed to create service 1' });
    }
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({ message: 'Failed to create service 2' });
  }
};

export default {
  getAllServices,
  getServicesPaginationFilter,
  getAllServicesForDropdown,
  getServiceById,
  getEnabledServiceById,
  getServiceCategories,
  validateServiceData,
  createService,
};
