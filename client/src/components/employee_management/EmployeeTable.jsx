import { useState, useEffect } from 'react';
import { Table, Badge, Box, Container, Button, Stack, Text, HStack, Input, Center } from '@chakra-ui/react';
import { api } from '@/interceptors/axios';
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
} from '@/components/ui/dialog';
import { NativeSelectRoot, NativeSelectField } from '@/components/ui/native-select';
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from '@/components/ui/pagination';

import EditEmployeeDialog from './EditEmployeeDialog';

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5); // Default limit per page
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // Debounced state
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortField, setSortField] = useState('employee_name');
  const [isActive, setIsActive] = useState('');

  // Debounced fetch function for search and pagination
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearchQuery, sortField, sortOrder, isActive, page, limit]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      let queryParams = `q=${debouncedSearchQuery}&sortField=${sortField}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`;
      if (isActive !== '') queryParams += `&active=${isActive}`;

      const response = await api.get(`/em/search?${queryParams}`);
      setEmployees(response.data.data);
      setTotalEmployees(response.data.pagination.totalEmployees);
    } catch (err) {
      setError('Failed to fetch employees. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to page 1 when search query changes
  };

  // Handle pagination change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      await api.delete(`/em/${selectedEmployee.employee_id}`);
      setEmployees((prev) => prev.filter((emp) => emp.employee_id !== selectedEmployee.employee_id));
      setSelectedEmployee(null);
      fetchEmployees(searchQuery, page, limit); // Refresh employee list
    } catch (err) {
      alert('Failed to delete employee. Please try again.');
    }
  };

  const handleEmployeeUpdate = () => {
    fetchEmployees(searchQuery, page, limit);
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={6}>
        <Text>Loading employees...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={6}>
        <Text color="red.500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Text fontSize="2xl" py="6" fontWeight="bold">
        Employee Management
      </Text>

      {/* Header Section */}
      <HStack justifyContent="space-between" mb={4}>
        <HStack>
          {/* Filter by Active Status */}
          <NativeSelectRoot variant="subtle">
            <NativeSelectField
              placeholder="Select Status"
              name="status"
              value={isActive}
              width="250px"
              items={[
                { label: 'All', value: '' },
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ]}
              onChange={(e) => setIsActive(e.target.value)}
            />
          </NativeSelectRoot>

          {/* Sorting Dropdown */}
          <NativeSelectRoot variant="subtle">
            <NativeSelectField
              placeholder="Sort Field"
              name="sortField"
              value={sortField}
              width="250px"
              items={[
                { label: 'Name', value: 'employee_name' },
                { label: 'Code', value: 'employee_code' },
              ]}
              onChange={(e) => setSortField(e.target.value)}
            />
          </NativeSelectRoot>

          <NativeSelectRoot variant="subtle">
            <NativeSelectField
              placeholder="Sort Order"
              name="sortOrder"
              value={sortOrder}
              width="250px"
              items={[
                { label: 'A → Z', value: 'asc' },
                { label: 'Z → A', value: 'desc' },
              ]}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </NativeSelectRoot>
        </HStack>
        <HStack>
          <Input
            placeholder="Search employees by name, email, or code..."
            variant={'subtle'}
            size="md"
            width="250px"
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
          />
          <Button colorPalette="teal" size="md" className="border">
            <a href="/createEmployee"> Add New Employee</a>
          </Button>
        </HStack>
      </HStack>

      {/* Total Employees Count */}
      <Text fontSize="md" mb={2}>
        {totalEmployees > 0 ? `${totalEmployees} employees found` : 'No employees found'}
      </Text>

      {/* Table Section */}
      <Box rounded="md" overflow="hidden" shadow="sm" overflowX="auto" mb={3}>
        <Table.Root>
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader>No</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Code</Table.ColumnHeader>
              <Table.ColumnHeader>Contact</Table.ColumnHeader>
              <Table.ColumnHeader>Email</Table.ColumnHeader>
              <Table.ColumnHeader>Department</Table.ColumnHeader>
              <Table.ColumnHeader>Position</Table.ColumnHeader>
              <Table.ColumnHeader>Commission %</Table.ColumnHeader>
              <Table.ColumnHeader>Active</Table.ColumnHeader>
              <Table.ColumnHeader>Created At</Table.ColumnHeader>
              <Table.ColumnHeader>Updated At</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {employees.map((employee, index) => (
              <Table.Row key={employee.employee_id}>
                <Table.Cell>{index + 1 + (page - 1) * limit}</Table.Cell>
                <Table.Cell>{employee.employee_name}</Table.Cell>
                <Table.Cell>{employee.employee_code}</Table.Cell>
                <Table.Cell>{employee.employee_contact}</Table.Cell>
                <Table.Cell>{employee.employee_email}</Table.Cell>
                <Table.Cell>{employee.cs_department?.department_name}</Table.Cell>
                <Table.Cell>{employee.cs_position?.position_name}</Table.Cell>
                <Table.Cell>{employee.commission_percentage}%</Table.Cell>
                <Table.Cell>
                  {employee.employee_is_active ? (
                    <Badge colorPalette="green">Yes</Badge>
                  ) : (
                    <Badge colorPalette="red">No</Badge>
                  )}
                </Table.Cell>
                <Table.Cell>{formatDateTime(employee.created_at)}</Table.Cell>
                <Table.Cell>{formatDateTime(employee.updated_at)}</Table.Cell>
                <Table.Cell>
                  <HStack spacing={2}>
                    {/* Edit Button */}
                    <DialogRoot size="cover">
                      <DialogTrigger asChild>
                        <Button
                          size="xs"
                          colorPalette="blue"
                          className="border"
                          variant="outline"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        {selectedEmployee && (
                          <EditEmployeeDialog employee={selectedEmployee} onUpdate={handleEmployeeUpdate} />
                        )}
                      </DialogContent>
                    </DialogRoot>

                    {/* Delete Button */}
                    <DialogRoot>
                      <DialogTrigger asChild>
                        <Button
                          size="xs"
                          colorPalette="red"
                          className="border"
                          variant="outline"
                          onClick={() => setSelectedEmployee(employee)}
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
                          <Text>Are you sure you want to delete {selectedEmployee?.employee_name}?</Text>
                        </DialogBody>
                        <DialogFooter>
                          <DialogActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogActionTrigger>
                          <Button colorPalette="red" onClick={handleDeleteEmployee}>
                            Yes, Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </DialogRoot>

                    <Button size="xs" colorPalette="yellow" variant="outline" className="border">
                      <a href={`/empr/${employee.employee_id}`}>Monitor monthly Performance</a>
                    </Button>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination */}
      <Center>
        <PaginationRoot
          count={totalEmployees}
          pageSize={limit}
          page={page}
          onPageChange={(e) => setPage(e.page)}
          colorPalette="teal"
        >
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

export default EmployeeTable;
