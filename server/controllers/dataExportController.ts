import { Request, Response, NextFunction } from 'express';
import model from '../models/dataExportModel.js';
import 'dotenv/config';


const getMemberDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const response = await model.getMemberDetails();
        if (response.success) {
            res.status(200).json({ message: response.message, data: response.data });
        } else {
            res.status(400).json({ message: response.message });
            return;
        }
    } catch (error) {
        console.error('Error in dataExportController.getMemberDetails:', error);
        next(error);
    }
};

const getUnusedVoucher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            return;
        }
    } catch (error) {
        console.error('Error in dataExportController.getUnusedVoucher:', error);
        next(error);
    }
};

const getUnusedCarePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { time } = req.query;

    if (typeof time !== 'string') {
        res.status(400).send('Time must be provided as a string.');
        return;
    }

    const timeInput = parseInt(time, 10);

    if (isNaN(timeInput)) {
        res.status(400).json({ message: 'Invalid time value. Must be an integer.' });
        return;
    }

    try {
        const response = await model.getUnusedMemberCarePackage(timeInput);
        console.log(response);
        if (response.success) {
            res.status(200).json({ message: "Get Unused Member Care Package was successful.", data: response.data });
        } else {
            res.status(400).json({ message: response.message });
            return;
        }
    } catch (error) {
        console.error('Error in dataExportController.getUnusedCarePackage:', error);
        next(error);
    }
};

export default {
    getMemberDetails,
    getUnusedVoucher,
    getUnusedCarePackage
};