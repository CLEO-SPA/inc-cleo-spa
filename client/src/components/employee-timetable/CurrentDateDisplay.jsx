import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSimulationStore } from '@/stores/useSimulationStore';
import { format } from 'date-fns';

const CurrentDateDisplay = () => {
  const { isSimulationActive, simulationStartDate } = useSimulationStore();

  const displayDate = isSimulationActive && simulationStartDate
    ? format(new Date(simulationStartDate), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');

  return (
    <div className='grid grid-cols-4 items-center gap-4'>
      <Label className='col-span-1'>Current Date</Label>
      <Input readOnly disabled value={displayDate} className='min-w-[180px]' />
    </div>
  );
};

export default CurrentDateDisplay;
