import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, FieldErrorText, Fieldset, Input, Stack, HStack } from '@chakra-ui/react';
import { DialogHeader, DialogTitle, DialogCloseTrigger, DialogBody } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { NativeSelectField, NativeSelectRoot } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';
import { api } from '@/interceptors/axios';

const EditEmployeeDialog = ({ employee, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    employee_name: employee?.employee_name || '',
    employee_id: employee?.employee_id || '',
    employee_code: employee?.employee_code || '',
    department_id: employee?.department_id || '',
    department_name: employee?.department_name || '', // Auto-filled
    position_id: employee?.position_id || '',
    commission_percentage: employee?.commission_percentage?.toString() || '',
    employee_contact: employee?.employee_contact || '',
    employee_email: employee?.employee_email || '',
    employee_is_active: employee?.employee_is_active ?? true,
  });

  const [positions, setPositions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get('/ps/all');
        if (Array.isArray(response.data)) {
          setPositions(response.data);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
        toaster.create({
          title: 'Error',
          description: 'Failed to fetch positions.',
          type: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchPositions();
  }, []);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-fill department name when position_id is selected
    if (name === 'position_id') {
      try {
        const response = await api.get(`/ps/${value}`);
        if (response.data) {
          setFormValues((prev) => ({
            ...prev,
            department_id: response.data.cs_department?.department_id || '',
            department_name: response.data.cs_department?.department_name || '', // Auto-fill department name
            commission_percentage: response.data.default_commission_percentage || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching department and commission based on position:', error);
      }
    }
  };

  const handleSwitchChange = (e) => {
    setFormValues((prev) => ({
      ...prev,
      employee_is_active: e.target.checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      ...formValues,
      department_name: undefined, // Remove department_name before submitting
    };

    try {
      const response = await api.put(`/em/${employee.employee_id}`, submitData);

      if (response.status === 200) {
        toaster.create({
          title: 'Employee Updated',
          description: `Employee "${employee.employee_name}" has been successfully updated!`,
          type: 'success',
          duration: 5000,
          isClosable: true,
        });

        onUpdate(); // Refresh employee list
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        toaster.create({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to update employee. Please try again.',
          type: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogCloseTrigger />
      </DialogHeader>
      <DialogBody>
        <form onSubmit={handleSubmit}>
          <Fieldset.Root size="xl" maxW="lg">
            <Stack mb="5">
              <Fieldset.Legend>Edit Employee Details</Fieldset.Legend>
            </Stack>

            <Fieldset.Content mb="3">
              <Field label="Employee Name" invalid={errors.employee_name}>
                <Input
                  name="employee_name"
                  value={formValues.employee_name}
                  onChange={handleInputChange}
                  variant={'subtle'}
                />
                <FieldErrorText>{errors.employee_name}</FieldErrorText>
              </Field>

              <Field label="Employee Code" invalid={errors.employee_code}>
                <Input
                  name="employee_code"
                  value={formValues.employee_code}
                  onChange={handleInputChange}
                  variant={'subtle'}
                />
                <FieldErrorText>{errors.employee_code}</FieldErrorText>
              </Field>

              <Field label="Position" invalid={errors.position_id}>
                <NativeSelectRoot>
                  <NativeSelectField
                    placeholder="Select a position"
                    name="position_id"
                    value={formValues.position_id}
                    onChange={handleInputChange}
                    items={positions.map((pos) => ({
                      label: pos.position_name,
                      value: pos.position_id.toString(),
                    }))}
                  />
                </NativeSelectRoot>
                <FieldErrorText>{errors.position_id}</FieldErrorText>
              </Field>

              <Field label="Department Name">
                <Input name="department_name" value={formValues.department_name} disabled variant={'subtle'} />
              </Field>

              <Field label="Commission Percentage" invalid={errors.commission_percentage}>
                <Input
                  name="commission_percentage"
                  value={formValues.commission_percentage}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.commission_percentage}</FieldErrorText>
              </Field>

              <Field label="Email" invalid={errors.employee_email}>
                <Input
                  name="employee_email"
                  value={formValues.employee_email}
                  onChange={handleInputChange}
                  variant={'subtle'}
                />
                <FieldErrorText>{errors.employee_email}</FieldErrorText>
              </Field>

              <Field label="Contact" invalid={errors.employee_contact}>
                <Input
                  name="employee_contact"
                  value={formValues.employee_contact}
                  onChange={handleInputChange}
                  variant={'subtle'}
                />
                <FieldErrorText>{errors.employee_contact}</FieldErrorText>
              </Field>

              <Field label="Is Active" invalid={errors.employee_is_active}>
                <Switch checked={formValues.employee_is_active} onChange={handleSwitchChange} />
                <FieldErrorText>{errors.employee_is_active}</FieldErrorText>
              </Field>
            </Fieldset.Content>

            <HStack justifyContent="flex-end" spacing={4} mt="4">
              <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
                Update
              </Button>
            </HStack>
          </Fieldset.Root>
        </form>
      </DialogBody>
    </>
  );
};

EditEmployeeDialog.propTypes = {
  employee: PropTypes.shape({
    employee_name: PropTypes.string,
    employee_id: PropTypes.string,
    employee_code: PropTypes.string,
    department_id: PropTypes.string,
    department_name: PropTypes.string,
    position_id: PropTypes.string,
    commission_percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    employee_contact: PropTypes.string,
    employee_email: PropTypes.string,
    employee_is_active: PropTypes.bool,
  }),
  onUpdate: PropTypes.func.isRequired,
};

export default EditEmployeeDialog;
