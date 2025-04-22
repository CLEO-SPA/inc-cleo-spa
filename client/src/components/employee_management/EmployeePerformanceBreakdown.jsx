import { useState, useEffect } from "react";
import { Table, Box, Container, Button, Stack, Text, HStack, Spinner } from "@chakra-ui/react";
import { api } from "@/interceptors/axios";
// import { Field } from "@/components/ui/field";
// import { NativeSelectRoot, NativeSelectField } from "@/components/ui/native-select";
import Navbar from "@/components/Navbar";
import { useParams } from "react-router-dom";

const EmployeePerformanceBreakdown = () => {
    const { employeeId, month, year, day } = useParams();

    // State for data
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log(data)

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/em/empr/${employeeId}/${month}/${year}/${day}`);
                setData(response.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [employeeId, month, year, day]);

    return (
        <>
        <Navbar />
        <Container maxW="container.xl" py={6}>
            <HStack justifyContent="space-between" mb={4}>
                <Stack>
                    <Text fontSize="2xl" fontWeight="bold">
                        Employee Daily Sales Performance and Commission Report
                    </Text>
                </Stack>
                {/* <HStack>
                    <Button colorPalette="teal">Export Data</Button>
                </HStack> */}
            </HStack>

            {loading ? (
                <Spinner size="lg" />
            ) : (
                <>
                    <Text fontSize="lg" fontWeight="semi-bold" mb={4}>
                        Employee Details
                    </Text>
                    {/* Employee Summary Table */}
                    <Box rounded="md" overflowX="auto" shadow="sm" mb={6}>

                        <Table.Root>
                            <Table.Header>
                                <Table.Row bg="bg.subtle">
                                    <Table.ColumnHeader>Employee Name</Table.ColumnHeader>
                                    <Table.ColumnHeader>Employee Code</Table.ColumnHeader>
                                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                                    <Table.ColumnHeader>Total Performance</Table.ColumnHeader>
                                    <Table.ColumnHeader>Total Commission</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell>{data?.employee_name || "N/A"}</Table.Cell>
                                    <Table.Cell>{data?.employee_code || "N/A"}</Table.Cell>
                                    <Table.Cell>{day}/{month}/{year}</Table.Cell>
                                    <Table.Cell>{data?.total_performance || "0.00"}</Table.Cell>
                                    <Table.Cell>{data?.total_commission || "0.00"}</Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                    </Box>


                    <Text fontSize="lg" fontWeight="semi-bold" mb={4}>
                        Daily Performance Breakdown
                    </Text>
                    {/* Daily Breakdown Table */}
                    <Box rounded="md" overflowX="auto" shadow="sm" mb={6}>

                        <Table.Root variant="simple">
                            <Table.Header>
                                <Table.Row bg="bg.subtle">
                                    <Table.ColumnHeader>Service</Table.ColumnHeader>
                                    <Table.ColumnHeader>Product</Table.ColumnHeader>
                                    <Table.ColumnHeader>Membership Account</Table.ColumnHeader>
                                    <Table.ColumnHeader>Member Care Package</Table.ColumnHeader>
                                    <Table.ColumnHeader>Total Performance</Table.ColumnHeader>
                                    <Table.ColumnHeader>Total Commission</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell>{data?.daily_breakdown?.[day]?.Service || "0.00"}</Table.Cell>
                                    <Table.Cell>{data?.daily_breakdown?.[day]?.Product || "0.00"}</Table.Cell>
                                    <Table.Cell>{data?.daily_breakdown?.[day]?.Membership_Account || "0.00"}</Table.Cell>
                                    <Table.Cell>{data?.daily_breakdown?.[day]?.Member_Care_Package || "0.00"}</Table.Cell>
                                    <Table.Cell>{data?.daily_breakdown?.[day]?.total_performance || "0.00"}</Table.Cell>
                                    <Table.Cell>{data?.daily_breakdown?.[day]?.total_commission || "0.00"}</Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* Commission Details Table */}
                    <Text fontSize="lg" fontWeight="semi-bold" mb={4}>
                        Commission Details
                    </Text>
                    <Box rounded="md" overflowX="auto" shadow="sm">
                        <Table.Root variant="simple">
                            <Table.Header>
                                <Table.Row bg="gray.100">
                                    <Table.ColumnHeader>Commission %</Table.ColumnHeader>
                                    <Table.ColumnHeader>Final Commission</Table.ColumnHeader>
                                    <Table.ColumnHeader>Reward Status</Table.ColumnHeader>
                                    <Table.ColumnHeader>Sharing Ratio</Table.ColumnHeader>
                                    <Table.ColumnHeader>Service/Product</Table.ColumnHeader>
                                    <Table.ColumnHeader>Amount</Table.ColumnHeader>
                                    <Table.ColumnHeader>Item Type</Table.ColumnHeader>
                                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {data?.report?.commissions && data.report.commissions.length > 0 ? (
                                    data.report.commissions.map((commission) => (
                                        <Table.Row key={commission.serving_employee_to_invoice_items_id}>
                                            <Table.Cell>{commission.commission_percentage || "0.00"}%</Table.Cell>
                                            <Table.Cell>{commission.final_calculated_commission_value || "0.00"}</Table.Cell>
                                            <Table.Cell>{commission.reward_status || "N/A"}</Table.Cell>
                                            <Table.Cell>{commission.sharing_ratio || "0.00"}%</Table.Cell>
                                            <Table.Cell>
                                                {commission.cs_invoice_items.service_name ||
                                                    commission.cs_invoice_items.product_name ||
                                                    "N/A"}
                                            </Table.Cell>
                                            <Table.Cell>{commission.cs_invoice_items.amount || "0.00"}</Table.Cell>
                                            <Table.Cell>{commission.cs_invoice_items.item_type || "N/A"}</Table.Cell>
                                            <Table.Cell>
                                                <Button colorPalette="blue" variant="outline" size="sm">
                                                    <a href={`/invoices/${commission.cs_invoice_items.invoice_id}`}>
                                                        View Invoice
                                                    </a>
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={8} textAlign="center">
                                            No commission data available.
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </>
            )}
        </Container>
        </>
    );
};

export default EmployeePerformanceBreakdown;
