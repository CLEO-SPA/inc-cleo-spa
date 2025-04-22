import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, FieldErrorText, Fieldset, Input, HStack } from "@chakra-ui/react";
import { DialogHeader, DialogTitle, DialogCloseTrigger, DialogBody } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { NativeSelectRoot, NativeSelectField } from "@/components/ui/native-select";
import { toaster } from "@/components/ui/toaster";
import { api } from "@/interceptors/axios";

const EditPositionDialog = ({ position, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    position_name: position?.position_name || "",
    position_description: position?.position_description || "",
    position_is_active: position?.position_is_active,
    department_id: position?.department_id || "",
    default_commission_percentage: position?.default_commission_percentage || "",
  });
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/dep/all");
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.log(error);
      toaster.create({
        title: "Error",
        description: "Failed to fetch departments.",
        type: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    setFormValues((prev) => ({
      ...prev,
      position_is_active: e.target.checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await api.put(`/ps/${position.position_id}`, formValues);
      if (response.status === 200) {
        toaster.create({
          title: "Position Updated",
          description: `Position "${response.data.updatedPosition.position_name}" has been successfully updated!`,
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
          description: "Failed to update position. Please try again.",
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
    <>
      <DialogHeader>
        <DialogTitle>Edit Position</DialogTitle>
        <DialogCloseTrigger />
      </DialogHeader>
      <DialogBody>
        <form onSubmit={handleSubmit}>
          <Fieldset.Root size="lg" maxW="lg">
            <Fieldset.Content mb="3">
              <Field label="Position Name" invalid={errors.position_name}>
                <Input
                  name="position_name"
                  value={formValues.position_name}
                  onChange={handleInputChange}
                  variant={"subtle"}
                />
                <FieldErrorText>{errors.position_name}</FieldErrorText>
              </Field>

              <Field label="Position Description">
                <Input
                  name="position_description"
                  value={formValues.position_description}
                  onChange={handleInputChange}
                  variant={"subtle"}
                />
              </Field>

              <Field label="Department" invalid={errors.department_id}>
                <NativeSelectRoot variant="subtle">
                  <NativeSelectField
                    placeholder="Select a department"
                    name="department_id"
                    value={formValues.department_id}
                    onChange={handleInputChange}
                    
                    items={departments.map((dept) => ({
                      label: dept.department_name,
                      value: dept.department_id.toString(),
                    }))}
                  />
                </NativeSelectRoot>
                {errors.department_id && (
                  <FieldErrorText>Select a department</FieldErrorText>
                )}
              </Field>

              <Field label="Default Commission Percentage" invalid={errors.default_commission_percentage}>
                <Input
                  name="default_commission_percentage"
                  type="number"
                  value={formValues.default_commission_percentage}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.default_commission_percentage}</FieldErrorText>
              </Field>

              <Field label="Is Active">
                <Switch
                  checked={formValues.position_is_active}
                  onChange={handleSwitchChange}
                />
              </Field>
            </Fieldset.Content>

            <HStack justifyContent="flex-end" mt="4">
              <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
                Update Position
              </Button>
            </HStack>
          </Fieldset.Root>
        </form>
      </DialogBody>
    </>
  );
};

EditPositionDialog.propTypes = {
  position: PropTypes.shape({
    position_id: PropTypes.string.isRequired,
    position_name: PropTypes.string,
    position_description: PropTypes.string,
    position_is_active: PropTypes.bool,
    department_id: PropTypes.string,
    default_commission_percentage: PropTypes.string,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditPositionDialog;
