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
import EditPositionDialog from "./EditPositionDialog";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";
import AddNewPositionDialog from "./AddNewPositionDialog";

const PositionTable = () => {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // Debounced state
  const [sortOrder, setSortOrder] = useState("asc");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPositions, setTotalPositions] = useState(0);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchPositions();
  }, [debouncedSearchQuery, sortOrder, isActive, page, limit]);

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      let queryParams = `query=${debouncedSearchQuery}&sort=${sortOrder}&page=${page}&limit=${limit}`;
      if (isActive !== "") queryParams += `&isActive=${isActive}`;

      const response = await api.get(`/ps/search?${queryParams}`);
      console.log(queryParams)
      setPositions(response.data.data);
      setTotalPositions(response.data.pagination.totalPositions);
    } catch {
      setError("Failed to fetch positions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePosition = async () => {
    if (!selectedPosition) return;
    try {
      await api.delete(`/ps/${selectedPosition.position_id}`);
      setPositions((prev) => prev.filter((p) => p.position_id !== selectedPosition.position_id));
      setSelectedPosition(null);
    } catch {
      alert("Failed to delete position.");
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
        <Text fontSize="2xl" fontWeight="bold">Position Management</Text>
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
            {/* Results Per Page */}
            <Field label="Results Per Page" width="120px">
            <Input
            variant="subtle"
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </Field>
          </Stack>
        </HStack>
        <HStack>
          <Input
            placeholder="Search positions..."
            variant={"subtle"}
            size="md"
            width="250px"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <HStack>
            <DialogRoot>
              <DialogTrigger asChild>
                <Button colorPalette="teal">Add New Position</Button>
              </DialogTrigger>
              <DialogContent>
                <AddNewPositionDialog onUpdate={fetchPositions} />
              </DialogContent>
            </DialogRoot>
          </HStack>
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
              <Table.ColumnHeader>Department</Table.ColumnHeader>
              <Table.ColumnHeader>Active</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {positions.map((position, index) => (
              <Table.Row key={position.position_id}>
                <Table.Cell>{index + 1 + (page - 1) * limit}</Table.Cell>
                <Table.Cell>{position.position_name}</Table.Cell>
                <Table.Cell>{position.position_description}</Table.Cell>
                <Table.Cell>{position.cs_department.department_name}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={position.position_is_active ? "green" : "red"}>
                    {position.position_is_active ? "Yes" : "No"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <HStack spacing={2}>
                    <DialogRoot>
                      <DialogTrigger asChild>
                        <Button size="sm" colorPalette="blue" variant="outline" onClick={() => setSelectedPosition(position)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {selectedPosition && (
                          <EditPositionDialog
                            position={selectedPosition}
                            onUpdate={fetchPositions}
                          />
                        )}
                      </DialogContent>
                    </DialogRoot>

                    {/* Delete Button */}
                    <DialogRoot placement="center" motionPreset="slide-in-bottom">
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => setSelectedPosition(position)}
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
                            Are you sure you want to delete position{" "}
                            <Text as="span" fontWeight="bold">
                              {selectedPosition?.position_name}
                            </Text>?
                          </Text>
                        </DialogBody>
                        <DialogFooter>
                          <DialogActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogActionTrigger>
                          <Button colorPalette="red" onClick={handleDeletePosition}>
                            Yes, Delete
                          </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                      </DialogContent>
                    </DialogRoot>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination */}
      <Center mt={4}>
        <PaginationRoot count={totalPositions} pageSize={limit} page={page} onPageChange={(e) => setPage(e.page)} colorPalette="teal">
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

export default PositionTable;
