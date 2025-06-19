import { Request, Response, NextFunction } from 'express';
import model from '../models/membershipTypeModel.js';
import 'dotenv/config';
import { NewMembershipType, UpdatedMembershipType } from '../types/model.types.js';


const getAllMembershipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const results = await model.getMembershipType();
    if (results.success) {
      res.status(200).json({ message: "Get Membership Types was successful.", data: results.data });
    } else {
      res.status(400).json({ message: results.message });
      return;
    }
  } catch (error) {
    console.error("Error getting membership types:", error);
    next(error);
  }
};

const createMembershipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const {
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by
  } = req.body;

  const newMembershipTypeData: NewMembershipType = {
    membership_type_name: membership_type_name,
    default_percentage_discount_for_products: parseFloat(default_percentage_discount_for_products),
    default_percentage_discount_for_services: parseFloat(default_percentage_discount_for_services),
    created_by: parseInt(created_by, 10)
  };

  if (!newMembershipTypeData) {
    res.status(400).json({ message: "Missing new Membership Type Body" });
    return;
  };

  for (let property in newMembershipTypeData) {
    const value = newMembershipTypeData[property as keyof typeof newMembershipTypeData];
    if (value === null || value === undefined) {
      res.status(400).json({ message: `Error 400: Property "${property}" is required.` });
      return;
    }
  };

  if (isNaN(Number(newMembershipTypeData.default_percentage_discount_for_products))) {
    res.status(400).json({ message: "Error 400: Default discount for products is invalid" });
    return;
  };

  if (isNaN(Number(newMembershipTypeData.default_percentage_discount_for_services))) {
    res.status(400).json({ message: "Error 400: Default discount for services is invalid" });
    return;
  };

  if (Number.isNaN(newMembershipTypeData.created_by)) {
    res.status(400).json({ message: "Error 400: Created By Employee id is invalid." });
    return;
  };

  try {
    const results = await model.addMembershipType(newMembershipTypeData);
    if (results.success) {
      res.status(201).json({ message: "Error 400: Create new Membership Type was successful." });
    } else {
      res.status(400).json({ message: results.message });
      return;
    };
  } catch (error) {
    console.error("Error creating membership types:", error);
    next(error);
  }
};

const updateMembershipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const {
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by
  } = req.body;

  const { id } = req.params;

  const updatedMembershipTypeData: UpdatedMembershipType = {
    id: parseInt(id, 10),
    membership_type_name: membership_type_name,
    default_percentage_discount_for_products: parseFloat(default_percentage_discount_for_products),
    default_percentage_discount_for_services: parseFloat(default_percentage_discount_for_services),
    created_by: created_by,
    last_updated_by: last_updated_by
  };

  if (!updatedMembershipTypeData) {
    res.status(400).json({ errorMessage: "Error 400: membership type form is required." });
    return;
  };

  for (let property in updatedMembershipTypeData) {
    const value = updatedMembershipTypeData[property as keyof typeof updatedMembershipTypeData];
    if (value === null || value === undefined) {
      res.status(400).json({ errorMessage: `Property "${property}" is required.` });
      return;
    }
  };

  if (isNaN(Number(updatedMembershipTypeData.default_percentage_discount_for_products))) {
    res.status(400).json({ message: "Error 400: Default discount for products is invalid" });
    return;
  };

  if (isNaN(Number(updatedMembershipTypeData.default_percentage_discount_for_services))) {
    res.status(400).json({ message: "Error 400: Default discount for services is invalid" });
    return;
  };

  if (Number.isNaN(updatedMembershipTypeData.created_by)) {
    res.status(400).json({ message: "Error 400: Created By Employee id is invalid." });
    return;
  };
  if (Number.isNaN(updatedMembershipTypeData.last_updated_by)) {
    res.status(400).json({ message: "Error 400: Last Updated By Employee id is invalid" });
    return;
  };

  try {
    const results = await model.setMembershipType(updatedMembershipTypeData);

    if (results.success) {
      res.status(201).json({ message: "Update Membership Type was successful." });
    } else {
      res.status(400).json({ message: results.message });
      return;
    }
  } catch (error) {
    console.error("Error updating membership types:", error);
    next(error);
  }
};

const deleteMembershipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    id
  } = req.params

  if (isNaN(Number(id))) {
    res.status(400).json({ message: "id needs to be a integer" });
    return;
  }

  const intId = parseInt(id);

  try {
    const results = await model.deleteMembershipType(intId);
    if (results.success) {
      res.status(200).json({ message: "Delete Membership Type was successful." });
    } else {
      res.status(400).json({ message: results.message });
    }
  } catch (error) {
    console.error("Error deleting membership types:", error);
    next(error)
  }
};

export default {
  getAllMembershipType,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
};