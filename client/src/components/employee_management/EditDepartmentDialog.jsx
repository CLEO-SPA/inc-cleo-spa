import { useState } from "react";
import PropTypes from "prop-types";
import {  Button, FieldErrorText, Fieldset, Input,  HStack } from "@chakra-ui/react";
import { DialogHeader, DialogTitle, DialogCloseTrigger, DialogBody } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { toaster } from "@/components/ui/toaster";
import { api } from "@/interceptors/axios";

const EditDepartmentDialog = ({ department, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    department_name: department?.department_name || "",
    department_description: department?.department_description || "",
    department_is_active: department?.department_is_active,
  });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
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
    setErrors({});

    try {
      const response = await api.put(`/dep/${department.department_id}`, formValues);
      if (response.status === 200) {
        toaster.create({
          title: "Department Updated",
          description: `Department "${response.data.updatedDepartment.department_name}" has been successfully updated!`,
          type: "success",
          duration: 5000,
          isClosable: true,
        });

        onUpdate(); // Refresh table
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        toaster.create({
          title: "Error",
          description: "Failed to update department. Please try again.",
          status: "error",
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
        <DialogTitle>Edit Department</DialogTitle>
        <DialogCloseTrigger />
      </DialogHeader>
      <DialogBody>
        <form onSubmit={handleSubmit}>
          <Fieldset.Root size="lg" maxW="lg">
            <Fieldset.Content mb="3">
              <Field label="Department Name" invalid={errors.department_name}>
                <Input
                  name="department_name"
                  value={formValues.department_name}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.department_name}</FieldErrorText>
              </Field>


              <Field label="Department Description">
                <Input
                  name="department_description"
                  value={formValues.department_description}
                  onChange={handleInputChange}
                />
              </Field>

              <Field label="Is Active">
                <Switch
                  checked={formValues.department_is_active}
                  onChange={handleSwitchChange}
                />
              </Field>
            </Fieldset.Content>

            <HStack justifyContent="flex-end" mt="4">
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


EditDepartmentDialog.propTypes = {
  department: PropTypes.shape({
    department_id: PropTypes.string.isRequired,
    department_name: PropTypes.string,
    department_description: PropTypes.string,
    department_is_active: PropTypes.bool,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditDepartmentDialog;