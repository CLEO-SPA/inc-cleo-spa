import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { api } from "@/interceptors/axios";
// const API_URL = import.meta.env.VITE_API_URL;

const MembershipType = () => {
  const [allMembershipTypes, setAllMembershipTypes] = useState([]);
  const [allApplicableTypes, setallApplicableTypes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);
  const [isUpdatingRules, setIsUpdatingRules] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedUpdateMT, setSelectedUpdateMT] = useState(null);

  useEffect(() => {
    fetchAllMembershipType();
    fetchApplicableType();
  }, []);

  const fetchAllMembershipType = async () => {
    try {
      const response = await api.get(`/mt`);
      console.log(response.data);
      console.log(response.data.allMembershipType);
      if (response.status !== 200) throw new Error(`HTTP error! status: ${response.status}`);
      setAllMembershipTypes(response.data.allMembershipType);
    } catch (error) {
      console.error(`Error fetching membership type details: ${error}`);
    }
  };

  const fetchApplicableType = async () => {
    try {
      const response = await api.get(`/mt/at`);
      console.log(response.data.data);
      if (response.status !== 200) throw new Error(`HTTP error! status: ${response.status}`);
      setallApplicableTypes(response.data.data);
    } catch (error) {
      console.error(`Error fetching applicable types details: ${error}`);
    }
  };

  // ------------------------------------------------------------------------------------------ //

  const CreateMembershipForm = () => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      console.log(data);

      try {
        console.log("Parsing data");
        await api.post(`/mt`, data);
        console.log("successful");
        fetchAllMembershipType();
        setIsCreating(false);  // Close modal after successful creation
      } catch (error) {
        console.error(`Error creating membership type: ${error}`);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg w-1/2 flex flex-col max-h-[90vh]">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Create New Membership Type</h2>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Membership Type Name</label>
                <input
                  id="membership_type_name"
                  type="text"
                  name="membership_type_name"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Default Service Discount (%)</label>
                <input
                  id="default_discount_service"
                  type="number"
                  name="default_discount_percentage_for_service"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Default Product Discount (%)</label>
                <input
                  id="default_discount_products"
                  type="number"
                  name="default_discount_for_products"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Default Stored Value</label>
                <input
                  id="default_stored_value"
                  type="number"
                  name="default_stored_value"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Performance and Commission Rules</h3>

                <div className="space-y-4 bg-gray-50 p-4 rounded">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Account Creation Performance Rule
                    </label>
                    <div className="bg-gray-100 p-2 rounded text-gray-500">
                      Not created yet
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Stored Value Top-up Performance Rule
                    </label>
                    <div className="bg-gray-100 p-2 rounded text-gray-500">
                      Not created yet
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Account Creation Commission Rule
                    </label>
                    <div className="bg-gray-100 p-2 rounded text-gray-500">
                      Not created yet
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Stored Value Top-up Commission Rule
                    </label>
                    <div className="bg-gray-100 p-2 rounded text-gray-500">
                      Not created yet
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="border border-gray-300 px-4 py-2 rounded bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="create-membership-button"
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded">
                    Create
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------------------------------------ //

  const UpdateRulesAndIncentives = ({ selectedType }) => {

    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      console.log(data);

      // Transform the data into the desired format
      const transformedData = {
        rule1: {
          employee_performance_incentive_rules_id: selectedType.creationPerfRuleId,
          application_type_id: parseInt(data.applicableTypeACP) || 0,
          percentage_value: parseInt(data.percentageValueACP) || 0,
          absolute_value: parseInt(data.absoluteValueACP) || 0,
          remarks: data.remarksACP
        },
        rule2: {
          employee_performance_incentive_rules_id: selectedType.creationCommissionRuleId,
          application_type_id: parseInt(data.applicableTypeACC) || 0,
          percentage_value: parseInt(data.percentageValueACC) || 0,
          absolute_value: parseInt(data.absoluteValueACC) || 0,
          remarks: data.remarksACC
        },
        rule3: {
          employee_performance_incentive_rules_id: selectedType.topUpPerfRuleId,
          application_type_id: parseInt(data.applicableTypeTUP) || 0,
          percentage_value: parseInt(data.percentageValueTUP) || 0,
          absolute_value: parseInt(data.absoluteValueTUP) || 0,
          remarks: data.remarksTUP
        },
        rule4: {
          employee_performance_incentive_rules_id: selectedType.topUpCommissionRuleId,
          application_type_id: parseInt(data.applicableTypeTUC) || 0,
          percentage_value: parseInt(data.percentageValueTUC) || 0,
          absolute_value: parseInt(data.absoluteValueTUC) || 0,
          remarks: data.remarksTUC
        }
      };

      console.log(transformedData);

      try {
        console.log("Parsing data");
        await api.put(`/mt/ri`, transformedData);
        console.log("successful");
        fetchAllMembershipType();
        setIsUpdatingRules(false);  // Close modal after successful creation
      } catch (error) {
        console.error(`Error updating rules and incentive: ${error}`);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Update Performance and Incentive Rules</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Account Creation Performance Rule */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-base font-semibold mb-3">Account Creation Performance Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Applicable Type</label>
                      <select
                        id="applicableTypeACP"
                        name="applicableTypeACP"
                        className="w-full border rounded p-1.5 text-sm"
                      >
                        {allApplicableTypes.map((type) => (
                          <option key={type.application_type_id} value={type.application_type_id}>
                            {type.application_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Percentage Value (%)</label>
                      <input
                        id="percentageValueACP"
                        type="number"
                        name="percentageValueACP"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Absolute Value</label>
                      <input
                        id="absoluteValueACP"
                        type="number"
                        name="absoluteValueACP"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Remarks</label>
                      <input
                        id="remarksACP"
                        type="text"
                        name="remarksACP"
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Creation Commission Rule */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-base font-semibold mb-3">Account Creation Commission Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Applicable Type</label>
                      <select
                        id="applicableTypeACC"
                        name="applicableTypeACC"
                        className="w-full border rounded p-1.5 text-sm"
                      >
                        {allApplicableTypes.map((type) => (
                          <option key={type.application_type_id} value={type.application_type_id}>
                            {type.application_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Percentage Value (%)</label>
                      <input
                        id="percentageValueACC"
                        type="number"
                        name="percentageValueACC"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Absolute Value</label>
                      <input
                        id="absoluteValueACC"
                        type="number"
                        name="absoluteValueACC"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Remarks</label>
                      <input
                        id="remarksACC"
                        type="text"
                        name="remarksACC"
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Stored Value Top-up Performance Rule */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-base font-semibold mb-3">Stored Value Top-up Performance Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Applicable Type</label>
                      <select
                        id="applicableTypeTUP"
                        name="applicableTypeTUP"
                        className="w-full border rounded p-1.5 text-sm"
                      >
                        {allApplicableTypes.map((type) => (
                          <option key={type.application_type_id} value={type.application_type_id}>
                            {type.application_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Percentage Value (%)</label>
                      <input
                        id="percentageValueTUP"
                        type="number"
                        name="percentageValueTUP"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Absolute Value</label>
                      <input
                        id="absoluteValueTUP"
                        type="number"
                        name="absoluteValueTUP"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Remarks</label>
                      <input
                        id="remarksTUP"
                        type="text"
                        name="remarksTUP"
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Stored Value Top-up Commission Rule */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="text-base font-semibold mb-3">Stored Value Top-up Commission Rule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Applicable Type</label>
                      <select
                        id="applicableTypeTUC"
                        name="applicableTypeTUC"
                        className="w-full border rounded p-1.5 text-sm"
                      >
                        {allApplicableTypes.map((type) => (
                          <option key={type.application_type_id} value={type.application_type_id}>
                            {type.application_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Percentage Value (%)</label>
                      <input
                        id="percentageValueTUC"
                        type="number"
                        name="percentageValueTUC"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Absolute Value</label>
                      <input
                        id="absoluteValueTUC"
                        type="number"
                        name="absoluteValueTUC"
                        defaultValue="0"
                        className="w-full border rounded p-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Remarks</label>
                      <input
                        id="remarksTUC"
                        type="text"
                        name="remarksTUC"
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 mt-auto">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdatingRules(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded bg-white text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------------------------------------ //

  const UpdateMembershipForm = ({ selectedUpdateMT }) => {
    const handleSubmit = async (e) => {
      e.preventDefault();
      // updatedMt_id
      // updatedDef_sv
      // updatedDef_disc_prod
      // updatedDef_disc_svc
      // updatedMt_name
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      console.log(selectedUpdateMT);
      data.updatedMt_id = selectedUpdateMT.mt_id;
      console.log(data);

      try {
        console.log("Parsing data");
        await api.put(`/mt/umt`, data);
        console.log("successful");
        fetchAllMembershipType();
        setIsUpdatingMembership(false);  // Close modal after successful creation
      } catch (error) {
        console.error(`Error creating membership type: ${error}`);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg w-1/2 flex flex-col max-h-[90vh]">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Update Membership Type</h2>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Membership Type Name</label>
                <input
                  id="update_membership_type_name"
                  type="text"
                  name="updatedMt_name"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Default Service Discount (%)</label>
                <input
                  id="update_default_discount_service"
                  type="number"
                  name="updatedDef_disc_svc"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Default Product Discount (%)</label>
                <input
                  id="update_default_discount_products"
                  type="number"
                  name="updatedDef_disc_prod"
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Default Stored Value</label>
                <input
                  id="update_default_stored_value"
                  type="number"
                  name="updatedDef_sv"
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUpdatingMembership(false)}
                    className="border border-gray-300 px-4 py-2 rounded bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded">
                    Create
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------------------------------------ //

  const handleDelete = async (mt_id) => {
    try {
      await api.delete(`/mt/${mt_id}`);
      console.log("successful");
      fetchAllMembershipType();
    } catch (error) {
      console.error(`Error deleting membership type: ${error}`);
    }
  }

  // ------------------------------------------------------------------------------------------ //

  return (
    <div>
      <Navbar />
      <div className="flex justify-between items-center m-6">
        <h1 className="text-2xl font-bold">Manage Membership Types</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Add new membership type
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left border">ID</th>
              <th className="p-3 text-left border">Membership Type Name</th>
              <th className="p-3 text-left border">Default Service Discount (%)</th>
              <th className="p-3 text-left border">Default Product Discount (%)</th>
              <th className="p-3 text-left border">Default Stored Value </th>
              <th className="p-3 text-left border">Top-up Performance</th>
              <th className="p-3 text-left border">Top-up Commission</th>
              <th className="p-3 text-left border">Creation Performance</th>
              <th className="p-3 text-left border">Creation Commission</th>
              <th className="p-3 text-left border">Created At</th>
              <th className="p-3 text-left border">Updated At</th>
              <th className="p-3 text-center border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allMembershipTypes.map((type) => (
              <tr key={type.membership_type_id} className="hover:bg-gray-50">
                <td className="p-3 border">{type.membership_type_id}</td>
                <td className="p-3 border">{type.membership_type_name}</td>
                <td className="p-3 border">{type.default_discount_percentage_for_service}%</td>
                <td className="p-3 border">{type.default_discount_for_products}%</td>
                <td className="p-3 border">{type.default_stored_value}</td>
                <td className="p-3 border">
                  Type: {type.top_up_performance_application_type}<br />
                  Percentage: {type.top_up_performance_percentage_value}%<br />
                  Absolute: {type.top_up_performance_absolute_value}<br />
                  Remarks: {type.top_up_performance_remarks}
                </td>
                <td className="p-3 border">
                  Type: {type.top_up_commission_application_type}<br />
                  Percentage: {type.top_up_commission_percentage_value}%<br />
                  Absolute: {type.top_up_commission_absolute_value}<br />
                  Remarks: {type.top_up_commission_remarks}
                </td>
                <td className="p-3 border">
                  Type: {type.creation_performance_application_type}<br />
                  Percentage: {type.creation_performance_percentage_value}%<br />
                  Absolute: {type.creation_performance_absolute_value}<br />
                  Remarks: {type.creation_performance_remarks}
                </td>
                <td className="p-3 border">
                  Type: {type.creation_commission_application_type}<br />
                  Percentage: {type.creation_commission_percentage_value}%<br />
                  Absolute: {type.creation_commission_absolute_value}<br />
                  Remarks: {type.creation_commission_remarks}
                </td>
                <td className="p-3 border">{new Date(type.membership_type_created_at).toLocaleString()}</td>
                <td className="p-3 border">{new Date(type.membership_type_updated_at).toLocaleString()}</td>
                <td className="p-3 border">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedUpdateMT({
                          ...type,
                          mt_id: type.membership_type_id
                        });
                        setIsUpdatingMembership(true);
                      }}
                      className="border border-gray-300 py-1 px-3 rounded text-sm hover:bg-gray-50"
                    >
                      Update Membership Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType({
                          ...type,
                          topUpPerfRuleId: type.top_up_performance_rule_id, // Add rule IDs to the selected type
                          creationPerfRuleId: type.creation_performance_rule_id,
                          topUpCommissionRuleId: type.top_up_commission_rule_id,
                          creationCommissionRuleId: type.creation_commission_rule_id
                        });
                        setIsUpdatingRules(true);
                      }}
                      className="border border-gray-300 py-1 px-3 rounded text-sm hover:bg-gray-50"
                    >
                      Update Rules And Incentive
                    </button>
                    <button
                      className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                      onClick={() => handleDelete(type.membership_type_id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreating && <CreateMembershipForm />}
      {isUpdatingRules && <UpdateRulesAndIncentives selectedType={selectedType} />}
      {isUpdatingMembership && <UpdateMembershipForm selectedUpdateMT={selectedUpdateMT} />}
    </div>
  );
};

export default MembershipType;