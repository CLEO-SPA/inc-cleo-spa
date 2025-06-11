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
    throw new Error("Error: Get all Membership Types was not successful.");
  };
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
    throw new Error("Missing new Membershi Type Body");
  };

  for (let property in newMembershipTypeData) {
    const value = newMembershipTypeData[property as keyof typeof newMembershipTypeData];
    if (value === null || value === undefined) {
      throw new Error(`Property "${property}" is required.`);
    }
  };

  try {
    const response = model.addMembershipType(newMembershipTypeData);
    res.status(201).json({ message: "Create new Membership Type was successful.", data: response });
  } catch (error) {
    throw new Error("Error: Create new Membership Type was not successful.");
  };
};

const updateMembershipType = async (req: Request, res: Response): Promise<void> => {

  const {
    membership_type_id,
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by
  } = req.body;

  const updatedMembershipTypeData: UpdatedMembershipType = {
    membership_type_id,
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by
  };

  if (!updatedMembershipTypeData) {
    throw new Error("Missing new Membershi Type Body");
  };

  for (let property in updatedMembershipTypeData) {
    const value = updatedMembershipTypeData[property as keyof typeof updatedMembershipTypeData];
    if (value === null || value === undefined) {
      throw new Error(`Property "${property}" is required.`);
    }
  };

  try {
    const response = model.setMembershipType(updatedMembershipTypeData);
    res.status(201).json({ message: "Update Membership Type was successful.", data: response });
  } catch (error) {
    throw new Error("Error: Update Membership Type was not successful.");
  };
};

const deleteMembershipType = async (req: Request, res: Response): Promise<void> => {
  try {
    const response = model.removeMembershipType(0); // testing
    res.status(200).json({ message: "Delete Membership Type was successful.", data: response });
  } catch (error) {
    throw new Error("Error: Delete Membership Type was not successful.");
  };
};

export default {
  getAllMembershipType,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
};