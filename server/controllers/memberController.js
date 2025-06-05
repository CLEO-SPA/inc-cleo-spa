import model from '../models/memberModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import mailService from '../services/mailService.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';


const getAllMembersForDropdown = async (req, res) => {
  console.log("Fetching all members for dropdown");
  try {
    const members = await model.getAllMembersForDropdown();
    res.status(200).json(members);
  } catch (error) {
    console.error('Error in getAllMembersForDropdown:', error);
    res.status(500).json({ message: 'Failed to fetch members for dropdown' });
  }
};


export default {
  getAllMembersForDropdown,
};
