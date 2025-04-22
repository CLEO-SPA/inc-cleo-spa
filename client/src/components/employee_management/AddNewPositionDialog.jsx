import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, FieldErrorText, Fieldset, Input, HStack } from "@chakra-ui/react";
import { DialogHeader, DialogTitle, DialogCloseTrigger, DialogBody } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { NativeSelectRoot, NativeSelectField } from "@/components/ui/native-select";
import { toaster } from "@/components/ui/toaster";
import { api } from "@/interceptors/axios";

const AddNewPositionDialog = ({ onUpdate }) => {
  const [formValues, setFormValues] = useState({
    position_name: "",
    position_description: "",
    position_is_active: true,
    department_id: "",
    default_commission_percentage: "",
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
      const response = await api.post("/ps/", formValues);
      if (response.status === 201) {
        toaster.create({
          title: "Position Added",
          description: `Position "${response.data.position_name}" has been successfully created!`,
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
          description: "Failed to add position. Please try again.",
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
    <div className="no-tailwind">
      <DialogHeader>
        <DialogTitle>Create a new position</DialogTitle>
        <DialogCloseTrigger />
      </DialogHeader>
      <DialogBody>
        <form onSubmit={handleSubmit}>
          <Fieldset.Root size="lg" maxW="lg">
            <Fieldset.Content mb="3">
              <Field label="Position Name" invalid={errors.position_name}>
                <Input
                variant={"subtle"}
                  name="position_name"
                  value={formValues.position_name}
                  onChange={handleInputChange}
                />
                <FieldErrorText>{errors.position_name}</FieldErrorText>
              </Field>

              <Field label="Position Description">
                <Input
                  name="position_description"
                  variant={"subtle"}
                  value={formValues.position_description}
                  onChange={handleInputChange}
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
                  variant={"subtle"}
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
                Add Position
              </Button>
            </HStack>
          </Fieldset.Root>
        </form>
      </DialogBody>
    </div>
  );
};

AddNewPositionDialog.propTypes = {
  onUpdate: PropTypes.func.isRequired,
};

export default AddNewPositionDialog;