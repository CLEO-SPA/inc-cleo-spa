import { Request, Response, NextFunction } from 'express';
import model from '../models/membershipTypeModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { InvJwtPayload } from '../types/auth.types.js';
import { NewMembershipType, UpdatedMembershipType } from '../types/membershipTypeTypes.js';


const getAllMembershipType = async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await model.getMembershipType();
    console.log("Response on controller: ", response);
    res.status(200).json({ message: "Get Membership Types was successful.", data: response });
  } catch (error) {
    console.error("Error getting membership types:", error);
    res.status(500).json({ 
      message: "Failed to retrieve membership types",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const createMembershipType = async (req: Request, res: Response): Promise<void> => {

  const {
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by
  } = req.body;

  const newMembershipTypeData: NewMembershipType = {
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by
  };

  if (!newMembershipTypeData) {
    throw new Error("Missing new Membership Type Body");
  };

  for (let property in newMembershipTypeData) {
    const value = newMembershipTypeData[property as keyof typeof newMembershipTypeData];
    if (value === null || value === undefined) {
      throw new Error(`Property "${property}" is required.`);
    }
  };

  try {
    const response = await model.addMembershipType(newMembershipTypeData);

    res.status(201).json({ message: "Create new Membership Type was successful.", data: response });
  } catch (error) {
        console.error("Error creating membership types:", error);
    res.status(500).json({ 
      message: "Failed to creating membership types",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const updateMembershipType = async (req: Request, res: Response): Promise<void> => {

  const {
    id,
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by
  } = req.body;

  const updatedMembershipTypeData: UpdatedMembershipType = {
    id,
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by
  };

  if (!updatedMembershipTypeData.id) {
    res.status(400).json({ errorMessage: "membership type id is required."});
  };

  if (!updatedMembershipTypeData) {
    res.status(400).json({ errorMessage: "membership type form is required."});
  };

  for (let property in updatedMembershipTypeData) {
    const value = updatedMembershipTypeData[property as keyof typeof updatedMembershipTypeData];
    if (value === null || value === undefined) {
      res.status(400).json({ errorMessage: `Property "${property}" is required.`});
    }
  };

  try {
    const response = await model.setMembershipType(updatedMembershipTypeData);

    console.log("Final log: ", response);
    res.status(201).json({ message: "Update Membership Type was successful.", data: response });
  } catch (error) {
    console.error("Error updating membership types:", error);
    res.status(500).json({ 
      message: "Failed to updating membership type",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const deleteMembershipType = async (req: Request, res: Response): Promise<void> => {
  const {
    id
  } = req.params

  console.log("1st log: ", id)

  if(isNaN(Number(id))) {
    throw new Error("id needs to be a integer");
  }

  const intId = parseInt(id);

  try {
    const response = await model.removeMembershipType(intId);
    res.status(200).json({ message: "Delete Membership Type was successful.", data: response });
  } catch (error) {
    console.error("Error deleting membership types:", error);
    res.status(500).json({ 
      message: "Failed to delete membership type",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export default {
  getAllMembershipType,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
};