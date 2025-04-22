import { useEffect, useState } from "react";
import { api } from "@/interceptors/axios";
import { useParams, useNavigate } from "react-router-dom";

const UpdateProductForm = () => {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [category_id, setCategory_id] = useState("");
  const [productData, setProductData] = useState({
    product_id: "",
    product_name: "",
    product_description: "",
    remarks: "",
    product_default_price: "",
    product_is_active: false,
    product_category_id: category_id,
    product_sequence_no: "",
  });

  //Message
  const [open, setOpen] = useState(false);
  //error message
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  //get Product Data
  const fetchProductData = async () => {
    try {
      const res = await api.get(`/p/getPro/${id}`);
      const data = res.data;
      setProductData({
        product_id: data.product_id,
        product_name: data.product_name,
        product_description: data.product_description,
        remarks: data.product_remarks,
        product_default_price: data.product_default_price,
        product_is_active: data.product_is_active,
        product_category_id: data.product_category_id,
        product_sequence_no: data.product_sequence_no.toString()
      });
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get("/p/getProCat");
      setCategories(res.data); // Set the resolved data to state
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories(); // Call the function
    fetchProductData();
  }, []);

  // const fetchSequenceNo = async () => {
  //   if (!category_id) return; // Skip fetching if category_id is null or undefined
  //   try {
  //     const { data } = await api.get(`/p/getProSeqNoByCat/${category_id}`);
  //     setProductData((prevData) => ({ ...prevData, product_sequence_no: data.toString() }));
  //   } catch (error) {
  //     console.error("Error fetching sequence number:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchSequenceNo();
  // }, [category_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setProductData((prevData) => ({ ...prevData, product_is_active: e }));
  };

  const handleSelectChange = (e) => {
    setCategory_id(e.target.value);
    setProductData((prevData) => ({ ...prevData, product_category_id: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/p/updatePro/${productData.product_id}`, productData, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 200) {
        setErrorMsg("");
        setCategory_id("");
        setProductData({
          product_name: "",
          product_description: "",
          remarks: "",
          product_default_price: "",
          product_is_active: true,
          product_category_id: "",
        });
        setOpen(true);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        setErrorMsg(error.response.data.message);
        setOpen(true);
      } else {
        console.error("Error:", error.message);
      }
    }
  };

  return (
    <>
      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Update Product Page</h3>
              <button onClick={() => { setOpen(false); navigate("/pdm")}} className="text-xl">X</button>
            </div>
            <div className="mt-4">
              {errorMsg ? (
                <p className="text-xl text-red-500">{errorMsg}</p>
              ) : (
                <p className="text-xl">Product was updated successfully!</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setOpen(false); navigate("/pdm")}} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}

      <div className="bg-white p-8 rounded-md shadow-md">
        <h2 className="text-4xl font-bold mb-6">Update a Product</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product ID */}
          <div>
            <label className="block text-lg font-medium mb-2">Product ID:</label>
            {productData.product_id}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-lg font-medium mb-2">Product Name</label>
            <input
              type="text"
              name="product_name"
              value={productData.product_name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-lg font-medium mb-2">Product Description</label>
            <textarea
              name="product_description"
              value={productData.product_description}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter product description"
              required
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-lg font-medium mb-2">Remarks</label>
            <textarea
              name="remarks"
              value={productData.remarks}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter remarks"
              required
            />
          </div>

          {/* Unit Price */}
          <div>
            <label className="block text-lg font-medium mb-2">Unit Price</label>
            <input
              type="number"
              name="product_default_price"
              value={productData.product_default_price}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="100"
              required
            />
          </div>

          {/* Is Visible Checkbox */}
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={productData.product_is_active}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className="mr-2"
              />
              Is Visible
            </label>
          </div>

          {/* Product Category */}
          <div>
            <label className="block text-lg font-medium mb-2">Product Category</label>
            {categories.length > 0 ? (
              <select
                name="product_category_id"
                value={productData.product_category_id}
                onChange={handleSelectChange}
                className="w-full p-2 border rounded-md"
                disabled

              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.product_category_id} value={category.product_category_id}>
                    {category.product_category_name}
                  </option>
                ))}
              </select>
            ) : (
              <div>Loading...</div> // Display a fallback message or loader
            )
            }
          </div>

          {/* Product Sequence Number */}
          <div>
            <label className="block text-lg font-medium mb-2">Product Sequence Number</label>
            <input
              type="text"
              name="product_sequence_no"
              value={productData.product_sequence_no}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter sequence number"
              disabled
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">
              Update Product
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UpdateProductForm;
