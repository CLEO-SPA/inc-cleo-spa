import { useState, useEffect } from "react";
import { Table, Badge, Box, Container, Button, Stack, Text, HStack, Input } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
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
import { Check, X } from "lucide-react";
import EditPaymentMethodDialog from "./EditPaymentMethodDialog";

const PaymentMethodTable = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/pm/all");
            setPaymentMethods(response.data);
        } catch {
            setError("Failed to fetch payment methods. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

        const handleDeleteMethod = async () => {
            if (!selectedMethod) return;
          
            try {
              await api.delete(`/pm/${selectedMethod.payment_method_id}`);
              setPaymentMethods((prev) =>
                prev.filter((method) => method.payment_method_id !== selectedMethod.payment_method_id)
              );
              setSelectedMethod(null);
              
              toaster.create({
                title: "Payment Method Deleted",
                description: `The payment method was successfully deleted.`,
                type: "success",
                duration: 5000,
                isClosable: true,
              });
            } catch (error) {
                let errorMessage = "Failed to delete payment method. Please try again.";

                if (error.response?.data?.message?.includes("Foreign key constraint violated")) {
                  errorMessage = "This payment method cannot be deleted because it is linked to existing invoices. Please update or remove associated invoices before deleting.";
                }
              toaster.create({
                title: "Error",
                description: errorMessage,
                type: "error",
                duration: 5000,
                isClosable: true,
              });
            }
          };
                

    const BooleanIndicator = ({ value }) => (
        value ? (
            <Check size={16} color="#38A169" style={{ margin: '0 auto' }} />
        ) : (
            <X size={16} color="#E53E3E" style={{ margin: '0 auto' }} />
        )
    );

    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    if (error) {
        return <Text color="red.500">{error}</Text>;
    }

    return (
        <Container maxW="container.xl" py={6}>
            <HStack justifyContent="space-between" mb={4}>
                <Stack>
                    <Text fontSize="2xl" fontWeight="bold">
                        Payment Methods
                    </Text>
                    <Text fontSize="md" color="gray.600">
                        Manage your payment methods and their settings
                    </Text>
                </Stack>
                <HStack>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 font-bold rounded-md">
                        <a href="/cpm">Add New Payment Method</a>
                    </Button>
                </HStack>
            </HStack>

            <Box rounded="md" overflowX="auto" shadow="sm">
                <Table.Root>
                    <Table.Header>
                        <Table.Row bg="bg.subtle">
                            <Table.ColumnHeader>No</Table.ColumnHeader>
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Status</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Pending Invoice</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Package Deduction</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Revenue Method</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {paymentMethods.map((method, index) => (
                            <Table.Row key={method.payment_method_id}>
                                <Table.Cell>{index + 1}</Table.Cell>
                                <Table.Cell>{method.payment_method_name}</Table.Cell>
                                <Table.Cell>
                                    <Badge bg={method.is_active ? "green.200" : "red.200"} >
                                        {method.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                    <BooleanIndicator value={method.is_used_to_create_pending_invoice} />
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                    <BooleanIndicator value={method.is_used_to_deduct_from_package} />
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                    <BooleanIndicator value={method.is_revenue} />
                                </Table.Cell>
                                <Table.Cell>
                                    <HStack spacing={2} justifyContent="center">
                                        <DialogRoot>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    bg="yellow.100"
                                                    className="py-4 px-4"
                                                    variant="outline"
                                                    onClick={() => setSelectedMethod(method)}
                                                >
                                                    Edit
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                {selectedMethod && (
                                                <EditPaymentMethodDialog
                                                method={selectedMethod}
                                                onUpdate={fetchPaymentMethods}
                                            />
                                            )}
                                            </DialogContent>
                                        </DialogRoot>

                                        <DialogRoot placement="center" motionPreset="slide-in-bottom">
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    bg="red.100"
                                                    className="py-4 px-4"
                                                    variant="outline"
                                                    onClick={() => setSelectedMethod(method)}
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
                                                        Are you sure you want to delete payment method{" "}
                                                        <Text as="span" fontWeight="bold">
                                                            {selectedMethod?.payment_method_name}
                                                        </Text>
                                                        ?
                                                    </Text>
                                                </DialogBody>
                                                <DialogFooter>
                                                    <DialogActionTrigger asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogActionTrigger>
                                                    <Button
                                                        color="red.600"
                                                        onClick={handleDeleteMethod}
                                                    >
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
        </Container>
    );
};

export default PaymentMethodTable;