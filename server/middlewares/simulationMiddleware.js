import { checkAndUpdateSimState, getCurrentSimStatus } from '../services/simulationService.js';

const simulationMiddleware = async (req, res, next) => {
  try {
    await checkAndUpdateSimState();

    const simStatus = getCurrentSimStatus();

    req.is_simulation = simStatus.isActive;
    res.setHeader('X-Simulation-Mode', simStatus.isActive ? 'true' : 'false');

    if (simStatus.isActive) {
      res.locals.simMsg = 'System is in simulation mode.';
      console.log(`Request to ${req.originalUrl} is in SIMULATION MODE.`);

      if (req.session.startDate_utc && new Date(req.session.startDate_utc) < new Date(simStatus.params.startDate_utc)) {
        return res.status(400).json({
          message: 'Start date is earlier than the simulation start date.',
          simulationStartDate: simStatus.params.startDate_utc,
        });
      }

      if (req.session.endDate_utc && new Date(req.session.endDate_utc) > new Date(simStatus.params.endDate_utc)) {
        return res.status(400).json({
          message: 'End date is later than the simulation end date.',
          simulationEndDate: simStatus.params.endDate_utc,
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in simulation middleware:', error);
    req.isSim = false;
    res.setHeader('X-Simulation-Mode', 'false');
    res.status(500).json({
      message: 'Error checking simulation state.',
      error: error.message || 'Unknown error',
    });
  }
};

export default simulationMiddleware;
