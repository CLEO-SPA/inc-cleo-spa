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
  return /^[\w\s\,-.&+_()$/]+$/.test(input);
}

// Get services with pagination and filter
const getServicesPaginationFilter = async (req: Request, res: Response, next: NextFunction) => {

  const { page, limit, search, category, status } = req.query;
  try {

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

    res.status(200).json(service); // Assuming only one row is returned
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

//Data validation for create and update service
const validateServiceData = async (req: Request, res: Response, next: NextFunction) => {
  const serviceData = req.body;

  const {
    service_name,
    service_description,
    service_remarks,
    service_duration,
    service_price,
    service_category_id,
    created_at,
    created_by,
  } = serviceData;

  //Check if all fields are provided
  if (!service_name || !service_duration || !service_price || !service_category_id || !created_at || !created_by) {
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

  if (!validator.isISO8601(created_at)) {
    throw new Error('Invalid data type');
  }

  next();
};

// Create service
const createService = async (req: Request, res: Response, next: NextFunction) => {
  const formData = req.body;
  try {
    if (!validator.isBoolean(formData.service_is_enabled.toString())) {
      res.status(400).json({ message: 'Invalid data type' });
      return;
    }
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
      res.status(400).json({ message: 'Failed to create service' });
    }
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({ message: 'Failed to create service' });
  }
};

// update service
const updateService = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id, 10);
  const formData = req.body;
  const { updated_by, updated_at } = formData;
  try {
    //check if service exists
    const service = await serviceModel.getServiceById(id);
    if (!service) {
      res.status(404).json({ message: 'Service Not Found' });
      return;
    }

    // validate updated by and updated at values
    if (!updated_by || !updated_at) {
      res.status(400).json({ message: 'Data missing from required fields.' });
      return;
    }

    // Dynamic Update payload
    const updatePayload: { [key: string]: any } = {};

    if (formData.service_name && formData.service_name !== service.service_name) {
      updatePayload.service_name = formData.service_name;
    }

    if (formData.service_description && formData.service_description !== service.service_description) {
      updatePayload.service_description = formData.service_description;
    }

    if (formData.service_remarks && formData.service_remarks !== service.service_remarks) {
      updatePayload.service_remarks = formData.service_remarks;
    }

    if (formData.service_duration && formData.service_duration !== service.service_duration) {
      updatePayload.service_duration = formData.service_duration;
    }
    if (formData.service_price && formData.service_price !== service.service_price) {
      updatePayload.service_price = formData.service_price;
    }

    if (formData.service_category_id && formData.service_category_id !== service.service_category_id) {
      updatePayload.service_category_id = formData.service_category_id;
      updatePayload.service_sequence_no = await serviceModel.getServiceSequenceNo(formData.service_category_id);
    }

    if (formData.created_at && formData.created_at !== service.created_at) {
      updatePayload.created_at = formData.created_at;
    }

    if (formData.created_by && formData.created_by !== service.created_by) {
      updatePayload.created_by = formData.created_by;
    }

    //if no changes detected so far
    if (Object.keys(updatePayload).length === 0) {
      res.status(400).json({ message: 'No changes detected' });
    } else {
      // add in updated at and updated by
      // because they might be changed
      updatePayload.updated_at = formData.updated_at;
      updatePayload.updated_by = formData.updated_by;
      updatePayload.id = id;
    }

    const updatedService = await serviceModel.updateService(updatePayload);
    if (updatedService) {
      res.status(200).json({ service: updatedService[0], message: 'Service updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to update service' });
    }
  } catch (error) {
    console.error('Error in updateService:', error);
    res.status(500).json({ message: 'Failed to update service' });
  }
};

// update service sequence
const reorderService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = req.body;

    const updatedSequence = await serviceModel.reorderServices(services);

    if(updatedSequence.success){
      res.status(200).json({message: "Reorder Service Sequence Successfully"})
    } else {
      res.status(400).json({message: "Error reordering service sequence"})
    }
  } catch (error) {
    console.error('Error in reorderService:', error);
    res.status(500).json({ message: 'Failed to reorder service sequence' });
  }
};

// update service status
// disable service
const disableService = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const id = parseInt(req.params.id,10);
    const data = req.body;

    let updateData: { [key: string]: any } = {
      id: id,
      updated_by: data.updated_by,
      updated_at: data.updated_at
    }
    
    // check service exists validation
    // check if disabled or not
    const service = await serviceModel.getServiceById(id);
    if (!service.service_is_enabled){
      res.status(400).json({ message: "Service is already disabled."});
      return;
    }
    
    // check if remarks was updated
    if (data.service_remarks && data.service_remarks !== service.service_remarks) {
      updateData.service_remarks = data.service_remarks;
    }
    
    // change status
    const updatedService = await serviceModel.disableService(updateData);
    if (updatedService){
      res.status(200).json({ message: "Disabled Service Successfully"})
    }

  }catch(error){
    console.error('Error in disableService:', error);
    res.status(500).json({ message: 'Failed to disable service' });
  }
}

const enableService = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const id = parseInt(req.params.id,10);
    const data = req.body;

    let updateData: { [key: string]: any } = {
      id: id,
      updated_by: data.updated_by,
      updated_at: data.updated_at
    }
    
    // check service exists validation
    // check if enabled or not
    const service = await serviceModel.getServiceById(id);
    if (service.service_is_enabled){
      res.status(400).json({ message: "Service is already enabled."});
      return;
    }
    
    // check if remarks was updated
    if (data.service_remarks && data.service_remarks !== service.service_remarks) {
      updateData.service_remarks = data.service_remarks;
    }
    
    // get service sequence no (last in the category)
    const service_sequence_no = parseInt(await serviceModel.getServiceSequenceNo(service.service_category_id)) + 1;
    updateData.service_sequence_no = service_sequence_no;

    // change status
    const updatedService = await serviceModel.enableService(updateData);
    if (updatedService){
      res.status(200).json({ message: "Enabled Service Successfully"})
    }

  }catch(error){
    console.error('Error in enableService:', error);
    res.status(500).json({ message: 'Failed to enable service' });
  }
}

// get services by categories
const getServicesByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category_id = parseInt(req.params.category_id, 10);

    if (isNaN(category_id)) {
      res.status(400).json({ message: 'Invalid service category ID' });
      return;
    }

    const services = await serviceModel.getServiceByCategory(category_id);
    res.status(200).json(services);
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};

// SERVICE CATEGORIES ROUTES
// Get Service Categories
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

// get sales history by service id, selected month and year
const getSalesHistoryByServiceId = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.serviceId, 10);
    const { month, year } = req.query;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const salesData = await serviceModel.getSalesHistoryByServiceId(
      id,
      parseInt(month as string, 10),
      parseInt(year as string, 10)
    );

    if (!salesData || salesData.length === 0) {
      return res.status(404).json({ message: 'No sales history found' });
    }

    const summary = salesData.find(row => row.result_type === 'monthly_summary');
    const daily = salesData.filter(row => row.result_type === 'daily_breakdown');

    res.status(200).json({ summary, daily });
  } catch (error) {
    console.error('Error in getSalesHistoryByServiceId:', error);
    res.status(500).json({ message: 'Failed to fetch sales history' });
  }
};


export default {
  getAllServices,
  getServicesPaginationFilter,
  getAllServicesForDropdown,
  getServiceById,
  getEnabledServiceById,
  getServicesByCategory,
  validateServiceData,
  createService,
  updateService,
  reorderService,
  disableService,
  enableService,
  getServiceCategories,
  getSalesHistoryByServiceId
};
