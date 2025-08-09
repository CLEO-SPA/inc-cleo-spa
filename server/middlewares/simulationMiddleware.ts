import { Request, Response, NextFunction } from 'express';
import { checkAndUpdateSimState, getCurrentSimStatus } from '../services/simulationService.js';

const simulationMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only check simulation state very occasionally to reduce DB load
    // Check every 100th request or if we don't have any data yet
    const simStatus = getCurrentSimStatus();
    const shouldUpdate = Math.random() < 0.01 || simStatus.lastFetchedTimestamp === 0;

    if (shouldUpdate) {
      await checkAndUpdateSimState();
    }

    // Use cached status for all requests
    const currentStatus = getCurrentSimStatus();

    req.is_simulation = currentStatus.isActive;
    res.setHeader('X-Simulation-Mode', currentStatus.isActive ? 'true' : 'false');

    if (currentStatus.isActive) {
      res.locals.simMsg = 'System is in simulation mode.';
      console.log(`Request to ${req.originalUrl} is in SIMULATION MODE.`);

      // Not needed, should be handled by client side.
      if (
        req.session.start_date_utc &&
        req.session.end_date_utc &&
        currentStatus.params?.start_date_utc &&
        currentStatus.params?.end_date_utc
      ) {
        // if (
        //   new Date(simStatus.params?.end_date_utc as string) == new Date(simStatus.params?.start_date_utc as string)
        // ) {
        //   console.log('is equal');
        // } else if (
        //   new Date(req.session.end_date_utc as string) < new Date(simStatus.params?.start_date_utc as string)
        // ) {
        //   res.status(400).json({
        //     message: 'Start date is earlier than the simulation start date.',
        //     simulationStartDate: simStatus.params?.start_date_utc,
        //   });
        //   return;
        // } else if (new Date(req.session.end_date_utc) > new Date(simStatus.params?.end_date_utc as string)) {
        //   res.status(400).json({
        //     message: 'End date is later than the simulation end date.',
        //     simulationEndDate: simStatus.params?.end_date_utc,
        //   });
        //   return;
        // }
      }
    } else if (req.session.end_date_is_default) {
      req.session.end_date_utc = new Date().toUTCString();
      // console.log('Updated Date:', req.session.end_date_utc);
    }

    next();
  } catch (error) {
    console.error('Error in simulation middleware:', error);
    req.is_simulation = false;
    res.setHeader('X-Simulation-Mode', 'false');
    throw new Error('Error checking simulation state.');
  }
};

export default simulationMiddleware;
