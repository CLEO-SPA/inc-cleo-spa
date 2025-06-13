import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSimulationStore } from '@/stores/useSimulationStore';
import { format } from 'date-fns';

// Function to get simulation-aware current date
export const getCurrentSimulationDate = () => {
  const { isSimulationActive, simulationStartDate } = useSimulationStore.getState();
  return isSimulationActive && simulationStartDate ? new Date(simulationStartDate) : new Date();
};

// Component to display current date
const CurrentDateDisplay = () => {
  const isSimulationActive = useSimulationStore((state) => state.isSimulationActive);
  const simulationStartDate = useSimulationStore((state) => state.simulationStartDate);

  const displayDate = format(
    isSimulationActive && simulationStartDate
      ? new Date(simulationStartDate)
      : new Date(),
    'yyyy-MM-dd'
  );

  return (
    <div className='grid grid-cols-4 items-center gap-4'>
      <Label className='col-span-1'>Current Date</Label>
      <Input readOnly disabled value={displayDate} className='min-w-[180px]' />
    </div>
  );
};

export default CurrentDateDisplay;
