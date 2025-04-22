import { useState, useEffect } from 'react';
import { Box, Button, FieldErrorText, Fieldset, Flex, Input, Stack } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { NativeSelectRoot, NativeSelectField } from '@/components/ui/native-select';
import { toaster } from '@/components/ui/toaster';
import { api } from '@/interceptors/axios';

const CreateEmployee = () => {
  const [formValues, setFormValues] = useState({
    employee_name: '',
    employee_code: '',
    employee_contact: '',
    employee_email: '',
    employee_is_active: true,
    department_id: '', // Submit this ID
    department_name: '', // Display this in UI
    position_id: '',
    commission_percentage: '',
    created_at: new Date().toISOString().slice(0, 16), // Default to current datetime
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

    if (name === 'position_id') {
      try {
        const response = await api.get(`/ps/${value}`);
        if (response.data) {
          setFormValues((prev) => ({
            ...prev,
            department_id: response.data.cs_department?.department_id || '',
            department_name: response.data.cs_department?.department_name || '',
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
      department_name: undefined, // Remove from submission
      created_at: new Date(formValues.created_at).toISOString(), // Format timestamp
    };

    try {
      const response = await api.post('/em', submitData);

      if (response.status === 201) {
        toaster.create({
          title: 'Employee Created',
          description: `Employee "${response.data.employee_name}" was created successfully.`,
          type: 'success',
          duration: 5000,
          isClosable: true,
        });

        setFormValues({
          employee_name: '',
          employee_code: '',
          employee_contact: '',
          employee_email: '',
          employee_is_active: true,
          department_id: '',
          department_name: '',
          position_id: '',
          commission_percentage: '',
          created_at: new Date().toISOString().slice(0, 16), // Reset to current date
        });
        setErrors({});
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        toaster.create({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create employee. Please try again.',
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
    <Flex justifyContent="center" minHeight="100vh" px={4} py={10}>
      <Box maxW="xl">
        <Fieldset.Root size="lg" maxW="md">
          <form onSubmit={handleSubmit}>
            <Stack mb="5">
              <Fieldset.Legend>Create a New Employee</Fieldset.Legend>
              <Fieldset.HelperText>Please provide details for the new employee.</Fieldset.HelperText>
            </Stack>

            <Fieldset.Content mb="3">
              <Field label="Employee Name" invalid={errors.employee_name}>
                <Input
                  name="employee_name"
                  variant="subtle"
                  px="2"
                  value={formValues.employee_name}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.employee_name}</FieldErrorText>
              </Field>

              <Field label="Employee Code (e.g., EMP001)" invalid={errors.employee_code}>
                <Input
                  name="employee_code"
                  variant="subtle"
                  px="2"
                  placeholder="Enter full employee code"
                  value={formValues.employee_code}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.employee_code}</FieldErrorText>
              </Field>

              <Field label="Email" invalid={errors.employee_email}>
                <Input
                  name="employee_email"
                  variant="subtle"
                  px="2"
                  value={formValues.employee_email}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.employee_email}</FieldErrorText>
              </Field>

              <Field label="Contact" invalid={errors.employee_contact}>
                <Input
                  name="employee_contact"
                  variant="subtle"
                  px="2"
                  value={formValues.employee_contact}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.employee_contact}</FieldErrorText>
              </Field>

              <Field label="Position" invalid={errors.position_id}>
                <NativeSelectRoot variant="subtle">
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
                {errors.position_id && <FieldErrorText>Select a position</FieldErrorText>}
              </Field>

              <Field label="Department Name">
                <Input name="department_name" variant="subtle" px="2" value={formValues.department_name} readOnly />
              </Field>

              <Field label="Commission Percentage" invalid={errors.commission_percentage}>
                <Input
                  name="commission_percentage"
                  variant="subtle"
                  px="2"
                  value={formValues.commission_percentage}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.commission_percentage}</FieldErrorText>
              </Field>

              <Field label="Creation Date & Time">
                <Input
                  type="datetime-local"
                  name="created_at"
                  variant="subtle"
                  px="2"
                  value={formValues.created_at}
                  onChange={handleInputChange}
                />
              </Field>

              <Field label="Is Active">
                <Switch
                  checked={formValues.employee_is_active}
                  onChange={handleSwitchChange}
                  size="md"
                  colorPalette="teal"
                />
              </Field>
            </Fieldset.Content>

            <Button type="submit" alignSelf="flex-end" colorPalette="teal" isLoading={isSubmitting}>
              Submit
            </Button>
          </form>
        </Fieldset.Root>
      </Box>
    </Flex>
  );
};

export default CreateEmployee;
