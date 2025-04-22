import { useState, useEffect } from "react";
import { Table, Badge, Box, Container, Button, Stack, Text, HStack, Input, Center } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { api } from "@/interceptors/axios";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
  DialogActionTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { NativeSelectRoot, NativeSelectField } from "@/components/ui/native-select";
import EditDepartmentDialog from "./EditDepartmentDialog";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";

const DepartmentTable = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // Debounced state
  const [sortOrder, setSortOrder] = useState("asc");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalDepartments, setTotalDepartments] = useState(0);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchDepartments();
  }, [debouncedSearchQuery, sortOrder, isActive, page, limit]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      let queryParams = `query=${debouncedSearchQuery}&sort=${sortOrder}&page=${page}&limit=${limit}`;
      if (isActive !== "") queryParams += `&isActive=${isActive}`;

      const response = await api.get(`/dep/search?${queryParams}`);
      setDepartments(response.data.data);
      setTotalDepartments(response.data.pagination.totalDepartments);
    } catch {
      setError("Failed to fetch departments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    try {
      await api.delete(`/dep/${selectedDepartment.department_id}`);
      setDepartments((prev) => prev.filter((d) => d.department_id !== selectedDepartment.department_id));
      setSelectedDepartment(null);
    } catch {
      alert("Failed to delete department.");
    }
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Stack mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Department Management</Text>
      </Stack>

      {/* Filters & Sorting */}
      <HStack justifyContent="space-between" mb={4}>
        <HStack>
          <Stack direction="row" spacing={4} mb={6}>
            {/* Filter by Active Status */}
            <Field label="Active Status" width="320px">
              <NativeSelectRoot variant="subtle">
                <NativeSelectField
                  placeholder="Select Status"
                  name="status"
                  value={isActive}
                  items={[
                    { label: "All", value: "" },
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                  onChange={(e) => setIsActive(e.target.value)}
                />
              </NativeSelectRoot>
            </Field>

            {/* Sorting Dropdown */}
            <Field label="Sort By Name" width="320px">
              <NativeSelectRoot variant="subtle">
                <NativeSelectField
                  placeholder="Sort Order"
                  name="sortOrder"
                  value={sortOrder}
                  items={[
                    { label: "A → Z", value: "asc" },
                    { label: "Z → A", value: "desc" },
                  ]}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </NativeSelectRoot>
            </Field>
          </Stack>
        </HStack>
        <HStack>
          <Input
            placeholder="Search departments..."
            size="md"
            width="250px"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant={"subtle"}
          />
          <Button colorPalette="teal">
            <a href="/createDepartment">Add New Department</a>
          </Button>
        </HStack>
      </HStack>

      {/* Table Section */}
      <Box rounded="md" overflowX="auto" shadow="sm">
        <Table.Root>
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>No</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Description</Table.ColumnHeader>
              <Table.ColumnHeader>Active</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {departments.map((department, index) => (
              <Table.Row key={department.department_id}>
                <Table.Cell>{index + 1 + (page - 1) * limit}</Table.Cell>
                <Table.Cell>{department.department_name}</Table.Cell>
                <Table.Cell>{department.department_description}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={department.department_is_active ? "green" : "red"}>
                    {department.department_is_active ? "Yes" : "No"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <HStack spacing={2}>
                    <DialogRoot>
                      <DialogTrigger asChild>
                        <Button size="sm" colorPalette="blue" variant="outline" onClick={() => setSelectedDepartment(department)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {selectedDepartment && (
                          <EditDepartmentDialog
                            department={selectedDepartment}
                            onUpdate={fetchDepartments}
                          />
                        )}
                      </DialogContent>
                    </DialogRoot>

                    {/* Delete Button */}
                    {/* <DialogRoot placement="center" motionPreset="slide-in-bottom">
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => setSelectedDepartment(department)}
                        >
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogCloseTrigger />
                        </DialogHeader>
                        <DialogBody>
                          <Text>
                            Are you sure you want to delete department{" "}
                            <Text as="span" fontWeight="bold">
                              {selectedDepartment?.department_name}
                            </Text>{" "}
                            with department code{" "}
                            <Text as="span" fontWeight="bold">
                              {selectedDepartment?.department_code}
                            </Text>?
                          </Text>
                        </DialogBody>
                        <DialogFooter>
                          <DialogActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogActionTrigger>
                          <Button colorPalette="red" onClick={handleDeleteDepartment}>
                            Yes, Delete
                          </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                      </DialogContent>
                    </DialogRoot> */}
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination */}
      <Center mt={4}>
        <PaginationRoot count={totalDepartments} pageSize={limit} page={page} onPageChange={(e) => setPage(e.page)} colorPalette="teal">
          <HStack>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </HStack>
        </PaginationRoot>
      </Center>
    </Container>
  );
};

export default DepartmentTable;
