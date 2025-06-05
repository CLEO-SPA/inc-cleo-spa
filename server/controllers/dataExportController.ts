import { Request, Response, NextFunction } from 'express';
import model from '../models/dataExportModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { InvJwtPayload } from '../types/auth.types.js';
import {
    DataToExportList,
    MemberDetailsData,
    UnusedMemberCarePackageData,
    UnusedMemberVoucherData
} from '../types/dataExportTypes.js';

const getMemberDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await model.getMemberDetails();
        if (response.success) {
            res.status(200).json({ message: response.message, data: response.data });
        } else {
            res.status(400).json({ message: response.message });
        }
    } catch (error) {
        console.error("Error getting Member Details:", error);
        res.status(500).json({
            message: "Failed to retrieve Member Details",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

const getUnusedVoucher = async (req: Request, res: Response): Promise<void> => {
    const { time } = req.query;

    if (typeof time !== 'string') {
        res.status(400).send('Time must be provided as a string.');
        return
    }

    const timeInput = parseInt(time, 10);

    if (isNaN(timeInput)) {
        res.status(400).json({ message: 'Invalid time value. Must be an integer.' });
        return;
    }

    try {
        const response = await model.getUnusedMemberVoucher(timeInput);
        if (response.success) {
            res.status(200).json({ message: response.message, data: response.data });
        } else {
            res.status(400).json({ message: response.message });
        }
    } catch (error) {
        console.error("Error getting Unused Member Voucher:", error);
        res.status(500).json({
            message: "Failed to retrieve Unused Member Voucher",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

const getUnusedCarePackage = async (req: Request, res: Response): Promise<void> => {
    const { time } = req.query;

    if (typeof time !== 'string') {
        res.status(400).send('Time must be provided as a string.');
        return
    }

    const timeInput = parseInt(time, 10);

    if (isNaN(timeInput)) {
        res.status(400).json({ message: 'Invalid time value. Must be an integer.' });
        return;
    }

    try {
        const response = await model.getUnusedMemberCarePackage(timeInput);
        if (response.success) {
            res.status(200).json({ message: "Get Unused Member Care Package was successful.", data: response.data });
        } else {
            res.status(400).json({ message: response.message });
        }
    } catch (error) {
        console.error("Error getting Unused Member Care Package:", error);
        res.status(500).json({
            message: "Failed to retrieve Unused Member Care Package",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

export default {
    getMemberDetails,
    getUnusedVoucher,
    getUnusedCarePackage
};