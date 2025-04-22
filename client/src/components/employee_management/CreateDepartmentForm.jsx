import { useState } from "react";
import { Box, Button, FieldErrorText, Fieldset, Flex, Input, Stack } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { toaster } from "@/components/ui/toaster";
import { api } from "@/interceptors/axios";

const CreateDepartment = () => {
  const [formValues, setFormValues] = useState({
    department_name: "",
    department_description: "",
    department_is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (e) => {
    setFormValues((prev) => ({
      ...prev,
      department_is_active: e.target.checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post("/dep", formValues);

      if (response.status === 201) {
        toaster.create({
          title: "Department Created",
          description: `Department "${response.data.department_name}" was created successfully.`,
          type: "success",
          duration: 5000,
          isClosable: true,
        });

        // Reset form
        setFormValues({
          department_name: "",
          department_description: "",
          department_is_active: true,
        });
        setErrors({});
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        toaster.create({
          title: "Error",
          description: error.response?.data?.message || "Failed to create department. Please try again.",
          type: "error",
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
              <Fieldset.Legend>Create a New Department</Fieldset.Legend>
              <Fieldset.HelperText>Please provide details for the new department.</Fieldset.HelperText>
            </Stack>

            <Fieldset.Content mb="3">
              <Field label="Department Name" invalid={errors.department_name}>
                <Input
                  name="department_name"
                  variant="subtle"
                  px="2"
                  value={formValues.department_name}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.department_name}</FieldErrorText>
              </Field>


              <Field label="Department Description" invalid={errors.department_description}>
                <Input
                  name="department_description"
                  variant="subtle"
                  px="2"
                  value={formValues.department_description}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.department_description}</FieldErrorText>
              </Field>

              <Field label="Is Active">
                <Switch
                  checked={formValues.department_is_active}
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

export default CreateDepartment;