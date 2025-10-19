--
-- PostgreSQL database dump
--

\restrict 5VAAp5GNaBM0u5c8XZ5a7YG0GniHs8qfOANIDyHrUtXAhAS74dwiJGYIfzyvVpi

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    actor_user_id uuid NOT NULL,
    action character varying(255) NOT NULL,
    target_id character varying(255),
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Records significant events for auditing';


--
-- Name: payment_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_info (
    product_id uuid NOT NULL,
    status character varying(20) DEFAULT 'incomplete'::character varying NOT NULL,
    amount numeric(10,2),
    cardholder_name character varying(255),
    expiry_date date,
    payment_method character varying(50),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    bill_attachment_path text,
    CONSTRAINT payment_info_status_check CHECK (((status)::text = ANY ((ARRAY['incomplete'::character varying, 'complete'::character varying])::text[])))
);


ALTER TABLE public.payment_info OWNER TO postgres;

--
-- Name: TABLE payment_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payment_info IS 'Billing information for each product';


--
-- Name: permission_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    service_id uuid,
    product_id uuid,
    CONSTRAINT permission_assignments_check CHECK (((service_id IS NOT NULL) OR (product_id IS NOT NULL)))
);


ALTER TABLE public.permission_assignments OWNER TO postgres;

--
-- Name: TABLE permission_assignments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.permission_assignments IS 'Core RBAC table linking users to resources';


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_id uuid,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    url text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS 'Products/modules associated with services';


--
-- Name: COLUMN products.url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.products.url IS 'Product URL added for Product Inventory module';


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    vendor character varying(255),
    url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: TABLE services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.services IS 'Company web services';


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    department character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Stores information about all individuals in the system';


--
-- Name: permission_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.permission_details AS
 SELECT pa.id,
    u.name AS user_name,
    u.email AS user_email,
    s.name AS service_name,
    p.name AS product_name,
        CASE
            WHEN (pa.service_id IS NOT NULL) THEN 'Service'::text
            WHEN (pa.product_id IS NOT NULL) THEN 'Product'::text
            ELSE NULL::text
        END AS permission_type
   FROM (((public.permission_assignments pa
     JOIN public.users u ON ((pa.user_id = u.id)))
     LEFT JOIN public.services s ON ((pa.service_id = s.id)))
     LEFT JOIN public.products p ON ((pa.product_id = p.id)));


ALTER TABLE public.permission_details OWNER TO postgres;

--
-- Name: products_with_services; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.products_with_services AS
 SELECT p.id,
    p.name AS product_name,
    p.description,
    s.name AS service_name,
    s.vendor,
    s.url AS service_url,
    p.created_at,
    p.updated_at
   FROM (public.products p
     JOIN public.services s ON ((p.service_id = s.id)));


ALTER TABLE public.products_with_services OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.roles IS 'Static table defining system roles';


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_roles IS 'Many-to-many relationship between users and roles';


--
-- Name: user_roles_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_roles_view AS
 SELECT u.id,
    u.name,
    u.email,
    u.department,
    r.name AS role_name,
    u.created_at,
    u.updated_at
   FROM ((public.users u
     LEFT JOIN public.user_roles ur ON ((u.id = ur.user_id)))
     LEFT JOIN public.roles r ON ((ur.role_id = r.id)));


ALTER TABLE public.user_roles_view OWNER TO postgres;

--
-- Name: workflow_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    assignee_user_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    details text,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workflow_tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'invited'::character varying, 'in_progress'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT workflow_tasks_type_check CHECK (((type)::text = ANY ((ARRAY['onboarding'::character varying, 'offboarding'::character varying])::text[])))
);


ALTER TABLE public.workflow_tasks OWNER TO postgres;

--
-- Name: TABLE workflow_tasks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.workflow_tasks IS 'Tasks for the inbox system';


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: payment_info payment_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_info
    ADD CONSTRAINT payment_info_pkey PRIMARY KEY (product_id);


--
-- Name: permission_assignments permission_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: products uq_products_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_name UNIQUE (name);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflow_tasks workflow_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_actor_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);


--
-- Name: idx_permission_assignments_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permission_assignments_product_id ON public.permission_assignments USING btree (product_id);


--
-- Name: idx_permission_assignments_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permission_assignments_service_id ON public.permission_assignments USING btree (service_id);


--
-- Name: idx_permission_assignments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permission_assignments_user_id ON public.permission_assignments USING btree (user_id);


--
-- Name: idx_permission_assignments_user_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permission_assignments_user_product ON public.permission_assignments USING btree (user_id, product_id);


--
-- Name: idx_permission_assignments_user_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permission_assignments_user_service ON public.permission_assignments USING btree (user_id, service_id);


--
-- Name: idx_products_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_service_id ON public.products USING btree (service_id);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_department ON public.users USING btree (department);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_workflow_tasks_assignee_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_tasks_assignee_status ON public.workflow_tasks USING btree (assignee_user_id, status);


--
-- Name: idx_workflow_tasks_assignee_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_tasks_assignee_user_id ON public.workflow_tasks USING btree (assignee_user_id);


--
-- Name: idx_workflow_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_tasks_status ON public.workflow_tasks USING btree (status);


--
-- Name: idx_workflow_tasks_target_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_workflow_tasks_target_user_id ON public.workflow_tasks USING btree (target_user_id);


--
-- Name: payment_info update_payment_info_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_payment_info_updated_at BEFORE UPDATE ON public.payment_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflow_tasks update_workflow_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON public.workflow_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_info payment_info_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_info
    ADD CONSTRAINT payment_info_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: permission_assignments permission_assignments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: permission_assignments permission_assignments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: permission_assignments permission_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_assignments
    ADD CONSTRAINT permission_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workflow_tasks workflow_tasks_assignee_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_assignee_user_id_fkey FOREIGN KEY (assignee_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: workflow_tasks workflow_tasks_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5VAAp5GNaBM0u5c8XZ5a7YG0GniHs8qfOANIDyHrUtXAhAS74dwiJGYIfzyvVpi

